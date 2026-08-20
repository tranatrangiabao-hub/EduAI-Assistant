"""
Vercel Python Serverless Function - bridge sang engine "SUPER VIP PRO MAX v19"
(vip.py) qua HTTP JSON, không sửa gì bên trong vip.py.

Đặt vip.py CÙNG THƯ MỤC (api/vip.py) để import bên dưới hoạt động trong
Vercel Python runtime.
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import dataclasses
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from vip import Generator, _v19_many, CURRICULUM  # noqa: E402

# Chỉ 2 loại này khớp sạch với schema của app.
# "Đúng/Sai" của vip.py là 1 câu đúng/sai đơn, khác cấu trúc 4 ý a/b/c/d
# mà app đang dùng -> cố tình KHÔNG bridge để tránh tạo câu hỏi sai định dạng.
_QTYPE_MAP = {
    "Trắc nghiệm": "multiple_choice",
    "Trả lời ngắn": "short_answer",
}

_DIFFICULTY_MAP = {
    "Cơ bản": ("Nhận biết", "Dễ"),
    "Khá": ("Thông hiểu", "Trung bình"),
    "Giỏi": ("Vận dụng", "Khá"),
    "HSG": ("Vận dụng cao", "Khó"),
}

_LABELS = "ABCD"


def _map_question(q):
    d = dataclasses.asdict(q)
    vip_qtype = d.get("qtype", "Trắc nghiệm")
    app_qtype = _QTYPE_MAP.get(vip_qtype)
    if app_qtype is None:
        return None  # bỏ qua loại chưa hỗ trợ (Đúng/Sai)

    taxonomy, difficulty_label = _DIFFICULTY_MAP.get(
        d.get("difficulty", ""), ("Thông hiểu", "Trung bình")
    )

    base = {
        "id": d.get("question_id") or f"vip_{d.get('topic_id', 'q')}_{id(q)}",
        "questionType": app_qtype,
        "question": d.get("text", ""),
        "explanation": d.get("explanation", ""),
        "taxonomyLevel": taxonomy,
        "difficulty": difficulty_label,
        "topic": d.get("topic", ""),
    }

    if app_qtype == "multiple_choice":
        raw_options = list(d.get("options") or [])
        clean_options = [
            (opt.split(". ", 1)[1] if len(opt) > 2 and opt[1:3] == ". " else opt)
            for opt in raw_options
        ]
        answer_letter = str(d.get("answer", "A")).strip()
        correct_index = _LABELS.index(answer_letter) if answer_letter in _LABELS else 0
        base["options"] = clean_options
        base["correctOption"] = correct_index
    else:  # short_answer
        answer_text = str(d.get("answer", ""))
        base["shortAnswer"] = answer_text
        base["acceptableAnswers"] = [answer_text, answer_text.lower()]

    return base


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)
            grade = query.get("grade", ["12"])[0]
            subject = query.get("subject", ["Toán"])[0]
            difficulty = query.get("difficulty", ["Random"])[0]
            qtype = query.get("type", ["Random"])[0]
            count = int(query.get("count", ["10"])[0])
            seed_raw = query.get("seed", [None])[0]
            seed = int(seed_raw) if seed_raw else None
            quality = query.get("quality", ["PRO"])[0]

            if grade.upper() in ("ALL", "TẤT CẢ", "TATCA"):
                grade = "TẤT CẢ"
            elif grade not in CURRICULUM:
                grade = "12"

            # Chặn số lượng để không vượt giới hạn thời gian chạy serverless
            count = max(1, min(count, 60))

            gen = _v19_many(
                Generator(seed), count, grade, subject, difficulty, qtype,
                quality, persistent=False,
            )

            questions = []
            for q in gen:
                mapped = _map_question(q)
                if mapped is not None:
                    questions.append(mapped)

            body = json.dumps(
                {"success": True, "questions": questions}, ensure_ascii=False
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            body = json.dumps(
                {"success": False, "error": str(e)}, ensure_ascii=False
            ).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(body)