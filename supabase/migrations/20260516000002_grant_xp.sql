-- RPC function to securely grant XP to a user's profile and specific stats
CREATE OR REPLACE FUNCTION grant_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_stat_names TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_stat_name TEXT;
  v_xp_per_stat INTEGER;
BEGIN
  -- 1. Add XP to main profile
  UPDATE profiles
  SET 
    current_xp = current_xp + p_xp_amount,
    -- Level up logic: Level = floor(current_xp / 100) + 1 (simplified)
    current_level = floor((current_xp + p_xp_amount) / 100) + 1
  WHERE id = p_user_id;

  -- 2. Add XP to specific stats if provided
  IF array_length(p_stat_names, 1) > 0 THEN
    v_xp_per_stat := p_xp_amount / array_length(p_stat_names, 1);
    
    FOREACH v_stat_name IN ARRAY p_stat_names
    LOOP
      UPDATE stats
      SET 
        xp = xp + v_xp_per_stat,
        level = floor((xp + v_xp_per_stat) / 100) + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id AND stat_name = v_stat_name::stat_category_enum;
    END LOOP;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
