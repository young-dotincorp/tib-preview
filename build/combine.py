#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ─────────────────────────────────────────────────────────────
# combine.py — 배포본 만들기
#   vendor/ (React 번들, 그대로 둠) 안의 마커 자리에
#   src/ 의 우리 부품들을 끼워 넣어
#   배포용 index.html / admin.html 을 생성합니다.
#
#   부품(컴포넌트):
#     • chatbot     → <!--__TW_CHATBOT__-->     (오른쪽 아래 상담 챗봇)
#     • chat-modal  → <!--__TW_CHATREPLY__-->   (답변 모달 + 실시간 채팅 모달)
#
#   실행:  python3 build/combine.py
#   ※ 비개발자는 직접 돌리지 않아도 됩니다 — 세션에서 Claude가 합쳐 드립니다.
# ─────────────────────────────────────────────────────────────
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def chatbot_fragment():
    return ('<style id="tw-cb-style">' + read('src/chatbot/chatbot.css') + '</style>'
            + read('src/chatbot/chatbot.html')
            + '<script>' + read('src/chatbot/chatbot.js') + '</script>')

def chatmodal_fragment():
    return ('<style id="tw-reply-style">' + read('src/chat-modal/chat-modal.css') + '</style>'
            + '\n<script>' + read('src/chat-modal/reply.js') + '</script>'
            + '\n<script>' + read('src/chat-modal/chat.js') + '</script>')

COMPONENTS = [
    ('<!--__TW_CHATBOT__-->',   chatbot_fragment),
    ('<!--__TW_CHATREPLY__-->', chatmodal_fragment),
]

def build():
    for vendor_rel, out_rel in [('vendor/tib-bundle.html',   'index.html'),
                                ('vendor/admin-bundle.html', 'admin.html')]:
        html = read(vendor_rel)
        for marker, frag in COMPONENTS:
            if html.count(marker) != 1:
                raise SystemExit('[오류] %s 안 마커 %s 가 %d개 (1개여야 함)'
                                 % (vendor_rel, marker, html.count(marker)))
            html = html.replace(marker, frag(), 1)
        with open(os.path.join(ROOT, out_rel), 'w', encoding='utf-8') as f:
            f.write(html)
        print('  빌드 완료: %-12s (%s bytes)' % (out_rel, format(len(html), ',')))

if __name__ == '__main__':
    print('우리 부품(챗봇 + 채팅모달)을 번들에 합치는 중...')
    build()
    print('끝. index.html / admin.html 을 GitHub(tib-preview)에 올리면 됩니다.')
