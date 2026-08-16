/**
 * A treatment_plan_item's chart_key links it to its drawn proposed-layer
 * chart graphic: "<tooth>-<conditionId>" for a single-tooth item, or
 * "bridge-<bridgeId>-<tooth>" for one tooth of a bridge. bridgeId is a
 * Postgres UUID and contains hyphens itself, so it can't be recovered with
 * a naive split("-")[1] - that only grabs the UUID's first segment.
 */
export function bridgeIdFromChartKey(chartKey: string): string {
  const withoutPrefix = chartKey.slice("bridge-".length);
  const lastDash = withoutPrefix.lastIndexOf("-");
  return withoutPrefix.slice(0, lastDash);
}
