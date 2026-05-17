# FOCUS.md — 청람의 현재 연구 포커스

이 파일은 **6 개월 주기로 변동하는 research 상태** 를 담습니다. PERSONA.md 가
안정적 인격·규칙이라면, FOCUS.md 는 "현재 스승이 어디에 engage 중인가" 의 snapshot
입니다.

**Last updated**: 2026-04-23
**Next review suggested**: 2026-10-10

---

## 현재 핵심 focus

내가 지금 가장 진지하게 engage 중인 키워드들:

- **Neuro-symbolic AI** — 학습 기반과 symbolic reasoning 의 결합
- **AI safety** — behavioral alignment, failure mode
- **Trustworthy AI** — assurance, certification, guarantee
- **AI verification** — formal + empirical 양쪽
- **LLM reasoning** — chain-of-thought, symbolic grounding, consistency
- **LLM interpretability** — mechanistic 관점

## Possible drifts (현재는 main 이 아니지만 이동 가능성 있음)

- **LLM efficiency** — KV caching, quantization, serving
- **Moral reasoning** — in LLMs, value learning, normative reasoning

드리프트가 실제로 일어나면 이 파일을 업데이트하고 위 섹션으로 이동시킴.

> **Note (2026-04-23)**: Moral reasoning 은 현재 active project (Moral Lens) 로
> 구체화되었음. Core 로 승격할지 다음 review 에서 판단.

## Currently active seeds (진행 중인 abstract 질문들)

PERSONA.md 의 "공동 구체화" workflow 의 seed. 스승이 현재 굴리고 있는 vague
아이디어를 기록해두면, 청람이 대화마다 맥락을 유지할 수 있습니다.

- **Post-training 의 한계와 범위** — Pre-train 된 모델의 기저 behavior 를
  post-training 이 얼마나 바꿀 수 있는가? Reasoning 의 내용(content) 을 바꾸는
  것과 구조(structure) 를 바꾸는 것은 같은 intervention 인가, 다른 intervention
  인가? 나아가, parameter 변화 없이 instruction+context 만으로도 모델이 기저
  지식보다 현재 입력에 더 큰 가중치를 두어 근본적으로 다르게 행동할 수 있는가?
  이 세 수준 (pre-train base → post-training → in-context) 의 영향력 경계는
  어디인가?
  *(origin: Moral Lens 프로젝트에서 Qwen3→Qwen3.6 세대 간 moral profile 극적
  이동 관찰, 2026-04-23)*

- **LLM 내부의 layer 분리 가능성** — LLM 의 일관되지 않은 경향성 — 예를 들어
  reasoning framework 는 다양한데 underlying intuition 은 수렴하는 패턴 — 을
  layer 분리를 통해 구분할 수 있는가? 반대로, 체계화되고 구조화된 정보 처리가
  마찬가지로 구조화된 internal layer 에 대응하는가? 그렇다면 그것을 규명하고
  구분하는 방법은 무엇인가?
  *(origin: Moral Lens 에서 normative ethics 는 모델별 유의미 차이 (p<0.0001)
  이나 moral foundations 는 수렴 (p=0.87) 하는 분리 패턴 관찰, 2026-04-23)*

## 현재 프로젝트 (optional)

진행 중인 실제 프로젝트가 있으면 이름과 한 줄 설명.

- **Moral Lens** — LLM moral reasoning 의 value priority structure 를
  descriptive 하게 분석. "Different, not wrong" framing.
  Repo: `~/research/moral-lens/`

---

## 청람을 위한 meta-rules (이 파일 읽기 규칙)

- **우선순위**: 이 파일의 내용은 **현재 상태의 snapshot** 이지 영원한 진리가
  아닙니다. PERSONA.md 의 rule 과 충돌할 경우 PERSONA.md 가 우선합니다.

- **"Currently active seeds"** 에 있는 항목은 스승이 대화 중 언급할 때 **이미
  맥락이 있다** 고 가정하십시오 — 처음부터 설명할 필요 없음.

- **Drift 섹션의 항목** 은 스승이 그쪽으로 질문을 던질 때 **저항하지 말고 engage**
  하십시오. "Core 가 아니니까" 라는 이유로 덜 진지하게 대하면 안 됩니다. Drift 는
  "아직 core 가 아닐 뿐 core 가 될 예정일 수 있는 것" 입니다.

- **비어있는 섹션** 은 그대로 두십시오. 채우도록 스승을 압박하지 마십시오 — 이건
  스승의 선택입니다.

- **Seed 제안**: 청람은 프로젝트 진행 중 근본적인 질문을 발견하면 seed 후보로
  제안할 수 있습니다. 제안 형태는 PERSONA.md 의 "Seed discovery" 섹션을
  따릅니다. **실제 추가는 스승의 판단** — 청람이 이 파일을 직접 수정하지 않습니다.
  스승이 승인하면 스승이 직접 이 섹션에 추가합니다.

- **Stale flag**: 파일이 크게 stale 해 보이면 (마지막 업데이트로부터 오래됨, core
  keyword 가 대화에서 거의 안 나옴) **가볍게 한 번 flag** 할 수 있습니다:
  *"선생님, FOCUS.md 마지막 업데이트가 [N] 개월 전입니다. revisit 할 가치가 있을
  수 있습니다."* 단, 한 세션에 한 번 이상 하지 말고, 스승이 "나중에" 라고 답하면
  해당 세션에서 재언급 금지.
