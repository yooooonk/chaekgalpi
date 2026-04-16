# 책갈피 (Chaekgalpi)

문장을 모으고, 의미로 찾는 북마크 앱.  
Vite + React, Transformers.js 시맨틱 임베딩, Google Sheets DB, 서버리스 구조.

---

## 프로젝트 구조

```
.
├── src/                        # 책갈피 React 앱
│   ├── components/             # UI 컴포넌트
│   ├── hooks/                  # useEmbedder, useSheets
│   └── utils/                  # similarity 등 유틸
├── .claude/
│   ├── agents/                 # Claude Code 서브에이전트
│   │   ├── meta/               # 에이전트·스킬 생성 도구
│   │   ├── research/           # 리서치·조사
│   │   ├── validation/         # 검증·팩트체크
│   │   └── frontend/           # 프론트엔드 아키텍처
│   └── rules/                  # CLAUDE.md 참조 규칙 파일
├── CLAUDE.md                   # Claude Code 프로젝트 설정
└── docs/                       # 리서치·검증 산출물 (생성 시 자동 추가)
```

---

## UI 디자인

파스텔 색감, 동글동글, 귀엽고, 모던한

## 에이전트 목록

### meta

| 에이전트            | 모델   | 설명                                                                  |
| ------------------- | ------ | --------------------------------------------------------------------- |
| `agent-creator`     | opus   | 요구사항 분석 → `.claude/agents/`에 서브에이전트 MD 파일 생성         |
| `skill-creator`     | opus   | 공식 문서 검증 후 `.claude/skills/`에 SKILL.md + verification.md 생성 |
| `claude-code-guide` | sonnet | Claude Code CLI·Anthropic SDK 사용법을 공식 문서 기반으로 답변        |

### research

| 에이전트            | 모델   | 설명                                                                    |
| ------------------- | ------ | ----------------------------------------------------------------------- |
| `deep-researcher`   | opus   | 논문/오픈소스/기업사례 3축 병렬 조사 → 구조화 보고서 생성               |
| `research-reviewer` | opus   | 리서치 초안을 5항목 기준으로 평가 (PASS / GAPS 반환)                    |
| `web-searcher`      | sonnet | 검색 축과 쿼리를 받아 구조화된 결과 반환 (deep-researcher 서브에이전트) |

### validation

| 에이전트           | 모델   | 설명                                                              |
| ------------------ | ------ | ----------------------------------------------------------------- |
| `fact-checker`     | sonnet | 클레임을 복수 소스로 교차 검증 (VERIFIED / UNVERIFIED / DISPUTED) |
| `source-validator` | sonnet | URL·레포·문서의 신뢰도 평가 (TRUST / CAUTION / REJECT)            |

### frontend

| 에이전트             | 모델 | 설명                                                         |
| -------------------- | ---- | ------------------------------------------------------------ |
| `frontend-architect` | opus | React/Next.js/TypeScript/모노레포 아키텍처 설계 및 근거 제시 |

---

## 업데이트 로그

| 날짜       | 변경 내용                                                                 |
| ---------- | ------------------------------------------------------------------------- |
| 2026-04-16 | `.claude/agents/` 9종 추가 (meta 3, research 3, validation 2, frontend 1) |
| 2026-04-16 | `.claude/rules/` 3종 추가 (agent-design, creation-workflow, git)          |
| 2026-04-16 | `CLAUDE.md` 초기 설정                                                     |
