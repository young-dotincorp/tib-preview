#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ─────────────────────────────────────────────────────────────
# combine.py — 배포본 만들기
#   vendor/ (React 번들, 그대로 둠) 안의 마커 자리에
#   src/chatbot/ (우리 챗봇 소스) 를 끼워 넣어
#   배포용 index.html / admin.html 을 생성합니다.
#
#   실행:  python3 build/combine.py
#   결과:  index.html, admin.html (저장소 루트, Vercel이 서빙)
#
#   ※ 비개발자는 직접 돌리지 않아도 됩니다.
#     세션에서 Claude가 돌려 배포본을 만들어 드리고,
#     영훈님은 결과 파일을 GitHub에 업로드만 하시면 됩니다.
# ─────────────────────────────────────────────────────────────
import os

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKER = '<!--__TW_CHATBOT__-->'

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def build():
    css    = read('src/chatbot/chatbot.css')
    markup = read('src/chatbot/chatbot.html')
    js     = read('src/chatbot/chatbot.js')
    # 추출 때와 동일한 래퍼로 다시 조립 (byte 동일 보장)
    fragment = '<style id="tw-cb-style">' + css + '</style>' + markup \
             + '<script>' + js + '</script>'

    targets = [('vendor/tib-bundle.html',   'index.html'),
               ('vendor/admin-bundle.html', 'admin.html')]
    for vendor_rel, out_rel in targets:
        v = read(vendor_rel)
        if v.count(MARKER) != 1:
            raise SystemExit('[오류] %s 안에 마커가 %d개 (1개여야 함)'
                             % (vendor_rel, v.count(MARKER)))
        html = v.replace(MARKER, fragment, 1)
        with open(os.path.join(ROOT, out_rel), 'w', encoding='utf-8') as f:
            f.write(html)
        print('  빌드 완료: %-12s (%s bytes)' % (out_rel, format(len(html), ',')))

if __name__ == '__main__':
    print('챗봇 소스를 번들에 합치는 중...')
    build()
    print('끝. index.html / admin.html 을 GitHub(tib-preview)에 올리면 됩니다.')
