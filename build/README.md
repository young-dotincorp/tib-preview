# build — 배포본 만드는 법

`vendor/`(React 번들)에 `src/chatbot/`(우리 챗봇 소스)를 합쳐
배포용 `index.html` · `admin.html`을 생성합니다.

## 실행

```bash
python3 build/combine.py
```

- 입력: `vendor/tib-bundle.html`, `vendor/admin-bundle.html` (챗봇 자리에 `<!--__TW_CHATBOT__-->` 마커),
  그리고 `src/chatbot/chatbot.css` · `chatbot.html` · `chatbot.js`
- 출력: 저장소 루트의 `index.html`, `admin.html`
- 별도 의존성 없음 (Python 3 표준 라이브러리만 사용)

## 무손실 보장

`combine.py`로 만든 결과는 현재 운영 중인 파일과 byte 단위로 동일함이 검증되었습니다.
즉 소스 분리로 기능이 바뀌거나 깨진 것이 없습니다.

## 비개발자 안내

직접 돌리지 않아도 됩니다. 작업 세션에서 Claude가 `src/chatbot`을 고치고
`combine.py`로 합쳐 배포본을 만들어 드립니다.
그 결과 파일(`index.html`)을 GitHub `tib-preview`에 업로드하면 Vercel이 자동 배포합니다.

## 향후 (CI 자동화)

GitHub Actions 등에서 push 시 `python3 build/combine.py`를 자동 실행해
배포본을 만들도록 연결할 수 있습니다. 원본 `TIB.jsx` 확보 후 정식 빌드 전환 시 함께 정리하면 됩니다.
