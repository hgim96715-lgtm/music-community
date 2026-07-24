/** U1 — 바 냅킨 손글씨. 한글 글리프는 globals.css `@import` (next/font latin subset ❌) */
export const napkinHandClassName = 'napkin-hand';

/** Mood-Custom — 흰 pill ❌ · 칩과 같은 손글씨 + 점선 밑줄 */
export const napkinMoodInputClassName = `${napkinHandClassName} w-[9.5rem] border-0 border-b border-dashed border-[#c9a66b]/40 bg-transparent px-0.5 py-1 text-[1.2rem] leading-none text-[#c9a66b] outline-none placeholder:text-[#a89880]/45 focus:border-[#c9a66b]`;

/** 방 주제 태그 — 무드와 같은 손글씨 · 여러 단어용 넓은 폭 */
export const napkinTopicInputClassName = `${napkinHandClassName} w-full border-0 border-b border-dashed border-[#c9a66b]/40 bg-transparent px-0.5 py-1.5 text-[1.25rem] leading-snug text-[#c9a66b] outline-none placeholder:text-[#a89880]/45 focus:border-[#c9a66b]`;
