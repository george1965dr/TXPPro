-- A now-fixed bug in addKanbanProcedure could write the literal string
-- "undefined" into tooth_numbers[0] for whole-tooth/overlay/bridge items
-- (surfaces "-" containing whole-tooth items were unaffected), which the UI
-- then displayed as "tooth #NaN". chart_key still holds the real tooth
-- number for every affected row - "<tooth>-<conditionId>" for single-tooth
-- items, "bridge-<bridgeId>-<tooth>" for bridge items - so it can be
-- recovered without touching anything else about the row.
update treatment_plan_items
set tooth_numbers = array[
  case
    when chart_key like 'bridge-%'
      then split_part(chart_key, '-', array_length(string_to_array(chart_key, '-'), 1))
    else split_part(chart_key, '-', 1)
  end
]
where tooth_numbers = array['undefined']
  and chart_key is not null;
