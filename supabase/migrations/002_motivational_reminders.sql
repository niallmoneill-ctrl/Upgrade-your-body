-- ============================================================
-- Upgrade Your Body — Motivational Reminders System
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Motivational phrases library
CREATE TABLE IF NOT EXISTS motivational_phrases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('Movement', 'Nutrition', 'Recovery', 'Mindset', 'General')),
  phrase text NOT NULL,
  author text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Track which phrases each user has seen (prevent repeats within 6 months)
CREATE TABLE IF NOT EXISTS phrase_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id uuid NOT NULL REFERENCES motivational_phrases(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  channel text NOT NULL CHECK (channel IN ('in_app', 'email')),
  UNIQUE (user_id, phrase_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_phrase_history_user ON phrase_history(user_id, sent_at);

-- 3. In-app notifications queue
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  phrase text DEFAULT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at);

-- 4. RLS policies
ALTER TABLE motivational_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Phrases are readable by everyone (they're not sensitive)
CREATE POLICY "Anyone can read phrases" ON motivational_phrases FOR SELECT USING (true);

-- Phrase history: users see only their own
CREATE POLICY "Users view own phrase history" ON phrase_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own phrase history" ON phrase_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: users see and manage only their own
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Seed motivational phrases
-- Movement (16 phrases)
INSERT INTO motivational_phrases (category, phrase) VALUES
('Movement', 'Your body was built to move. Every step counts, even the small ones.'),
('Movement', 'Motion is medicine. You never regret a workout, only the ones you skip.'),
('Movement', 'Consistency beats intensity. Show up today, even if it is only for ten minutes.'),
('Movement', 'Strong is not a destination. It is a way of living.'),
('Movement', 'The best workout is the one you actually do. Keep it simple.'),
('Movement', 'Your future self will thank you for moving today.'),
('Movement', 'Progress is not always visible, but every session builds something.'),
('Movement', 'You do not have to go fast. You just have to go.'),
('Movement', 'Energy creates energy. Movement unlocks more than fitness.'),
('Movement', 'Discipline is choosing between what you want now and what you want most.'),
('Movement', 'Small daily improvements are the key to staggering long-term results.'),
('Movement', 'Your body can stand almost anything. It is your mind you have to convince.'),
('Movement', 'Do not wait for motivation. Start, and motivation will follow.'),
('Movement', 'Every rep is a vote for the person you want to become.'),
('Movement', 'Rest when you need to, but never quit.'),
('Movement', 'The pain you feel today will be the strength you feel tomorrow.');

-- Nutrition (16 phrases)
INSERT INTO motivational_phrases (category, phrase) VALUES
('Nutrition', 'Food is fuel. What you put in determines what you get out.'),
('Nutrition', 'You do not need another diet. You need a system that works.'),
('Nutrition', 'Drink water first. Most of the time, your body is simply thirsty.'),
('Nutrition', 'Eat to nourish, not just to fill. Your body knows the difference.'),
('Nutrition', 'One good meal does not make you healthy, but one good habit does.'),
('Nutrition', 'The best nutrition plan is the one you can stick to.'),
('Nutrition', 'Your gut is your second brain. Treat it well.'),
('Nutrition', 'Progress over perfection. An imperfect healthy meal beats no meal planning at all.'),
('Nutrition', 'Hydration is the most underrated performance hack.'),
('Nutrition', 'Whole foods, simple choices, consistent habits. That is the formula.'),
('Nutrition', 'Sugar gives you a spike. Real food gives you sustained power.'),
('Nutrition', 'Meal prep is self-respect in advance.'),
('Nutrition', 'Your energy levels are a report card for how you eat.'),
('Nutrition', 'Protein is not just for gym goers. It is for everyone who wants to feel strong.'),
('Nutrition', 'The kitchen is where health transformations really begin.'),
('Nutrition', 'Listen to your body. It whispers before it screams.');

-- Recovery (16 phrases)
INSERT INTO motivational_phrases (category, phrase) VALUES
('Recovery', 'Rest is not laziness. It is where growth happens.'),
('Recovery', 'Sleep is the single best legal performance enhancer available.'),
('Recovery', 'You cannot pour from an empty cup. Recovery is not optional.'),
('Recovery', 'Your muscles grow when you rest, not when you train.'),
('Recovery', 'A good night of sleep is worth more than an extra hour of work.'),
('Recovery', 'Slow down to speed up. Recovery is the secret weapon.'),
('Recovery', 'Burnout is not a badge of honour. Boundaries are.'),
('Recovery', 'Quality sleep is not a luxury. It is a foundation.'),
('Recovery', 'Give yourself permission to pause. The world will still be there.'),
('Recovery', 'Your body repairs itself when you stop pushing. Let it.'),
('Recovery', 'Eight hours of sleep is not wasted time. It is invested time.'),
('Recovery', 'Stretching is not a warm-up. It is a daily practice.'),
('Recovery', 'Recovery is not the absence of effort. It is a different kind of effort.'),
('Recovery', 'The space between your workouts matters as much as the workouts themselves.'),
('Recovery', 'Breathe. Your nervous system is listening.'),
('Recovery', 'Rest days are training days for your mind.');

-- Mindset (16 phrases)
INSERT INTO motivational_phrases (category, phrase) VALUES
('Mindset', 'You are one decision away from a completely different life.'),
('Mindset', 'The only person you need to be better than is who you were yesterday.'),
('Mindset', 'Mindset is not everything, but everything starts with mindset.'),
('Mindset', 'What you focus on expands. Choose wisely.'),
('Mindset', 'Gratitude turns what you have into enough.'),
('Mindset', 'Your thoughts are not facts. Question the ones that hold you back.'),
('Mindset', 'Clarity comes from action, not thought.'),
('Mindset', 'You are not behind. You are on your own path.'),
('Mindset', 'Small wins build the confidence for big ones.'),
('Mindset', 'The voice in your head is not always right. Sometimes it needs coaching too.'),
('Mindset', 'Meditation is not about clearing your mind. It is about noticing what is there.'),
('Mindset', 'Comparison is the fastest way to lose sight of your own progress.'),
('Mindset', 'You are allowed to be a work in progress and a masterpiece at the same time.'),
('Mindset', 'The habit of showing up is more powerful than any single result.'),
('Mindset', 'Be patient with yourself. Growth is not linear.'),
('Mindset', 'Your daily routine is your daily vote for who you want to become.');

-- General (16 phrases)
INSERT INTO motivational_phrases (category, phrase) VALUES
('General', 'Today is a fresh page. Write something worth reading.'),
('General', 'You are building something. Trust the process.'),
('General', 'Consistency is what transforms average into extraordinary.'),
('General', 'Do not count the days. Make the days count.'),
('General', 'The best time to start was yesterday. The next best time is now.'),
('General', 'Health is not about being perfect. It is about being better than before.'),
('General', 'You are stronger than you think and more capable than you know.'),
('General', 'One percent better every day. That is all it takes.'),
('General', 'Discipline is the bridge between goals and accomplishment.'),
('General', 'You did not come this far to only come this far.'),
('General', 'Every expert was once a beginner. Keep going.'),
('General', 'Your health is an investment, not an expense.'),
('General', 'The secret to getting ahead is getting started.'),
('General', 'Champions are made in the moments nobody is watching.'),
('General', 'Fall in love with the process and the results will come.'),
('General', 'You owe it to yourself to become everything you have ever dreamed of being.');

-- 6. Helper function: get a fresh phrase for a user (not seen in last 6 months)
CREATE OR REPLACE FUNCTION get_fresh_phrase(p_user_id uuid, p_category text DEFAULT 'General')
RETURNS TABLE(phrase_id uuid, phrase text, author text) AS $$
BEGIN
  RETURN QUERY
  SELECT mp.id, mp.phrase, mp.author
  FROM motivational_phrases mp
  WHERE mp.category IN (p_category, 'General')
    AND mp.id NOT IN (
      SELECT ph.phrase_id
      FROM phrase_history ph
      WHERE ph.user_id = p_user_id
        AND ph.sent_at > now() - interval '6 months'
    )
  ORDER BY random()
  LIMIT 1;

  -- Fallback: if all phrases seen in last 6 months, pick the oldest-seen one
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT mp.id, mp.phrase, mp.author
    FROM motivational_phrases mp
    LEFT JOIN phrase_history ph ON ph.phrase_id = mp.id AND ph.user_id = p_user_id
    WHERE mp.category IN (p_category, 'General')
    ORDER BY ph.sent_at ASC NULLS FIRST
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
