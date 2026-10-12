const { ask, guard, clip } = require('../lib/ai');

module.exports = async (req, res) => {
  if (guard(req, res, 'plan', 5)) return;
  try {
    const b = req.body || {};
    const goal = clip(b.goal, 120);
    if (!goal) return res.status(400).json({ error: 'Missing goal' });
    const months = [1, 2, 3, 6].includes(+b.months) ? +b.months : 3;
    const hours = Math.min(8, Math.max(1, +b.hours || 2));
    const W = months * 4;
    const system = 'You are the planning engine of a goal-planner app. Reply with valid JSON only.';
    const prompt = `Goal: ${JSON.stringify(goal)}. Timeline: ${W} weeks. Daily time: ${hours} hours.
Return JSON shaped exactly as {"weeks":[{"title":"weekly milestone, max 12 words","days":["main task for day 1","...","main task for day 7"]}]}.
Use exactly ${W} weeks and exactly 7 days per week. Each day title is one concrete action of max 8 words. Progress logically from foundations to practice to mastery or launch.`;
    const raw = await ask({ system, messages: [{ role: 'user', content: prompt }], json: true, timeoutMs: 55000 });
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const weeks = (data.weeks || []).slice(0, W).map(w => ({
      title: clip(w && w.title, 120),
      days: (Array.isArray(w && w.days) ? w.days : []).slice(0, 7).map(t => clip(t, 90))
    }));
    if (!weeks.length) throw new Error('empty plan');
    res.status(200).json({ weeks });
  } catch (e) {
    console.error('plan failed:', e.message);
    res.status(502).json({ error: 'AI unavailable' });
  }
