/**
 * @fileoverview
 * Utility functions for hexagonal grid mathematics and pathfinding.
 */

/**
 * Calculates the Manhattan distance between two hex tiles using axial coordinates.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} q1 - The q coordinate of the first tile.
 * @param {number} r1 - The r coordinate of the first tile.
 * @param {number} q2 - The q coordinate of the second tile.
 * @param {number} r2 - The r coordinate of the second tile.
 * @returns {number} The distance in hex steps.
 */
export function hexDistance(q1, r1, q2, r2) {
  return Math.max(
    Math.abs(q1 - q2),
    Math.abs(r1 - r2),
    Math.abs(-(q1 + r1) - -(q2 + r2)),
  );
}

/**
 * Returns the axial coordinates of the neighbors of a hex tile.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} q - The q coordinate of the center tile.
 * @param {number} r - The r coordinate of the center tile.
 * @returns {Array<{q: number, r: number}>} An array of neighbor coordinates.
 */
export function hexNeighbors(q, r) {
  return [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 },
  ];
}

/**
 * Finds a path of hex tiles from a start tile to a target tile within a maximum distance.
 * Considers obstacles and enemy tiles (can target enemies but not pass through them).
 *
 * @this {import("../../sh.js").sh}
 * @param {number} startQ - The q coordinate of the start tile.
 * @param {number} startR - The r coordinate of the start tile.
 * @param {number} targetQ - The q coordinate of the target tile.
 * @param {number} targetR - The r coordinate of the target tile.
 * @param {number} maxDist - The maximum allowed path length (usually army strength).
 * @returns {number[]} An array of tile indices representing the path. Returns empty array if no path found.
 */
export function findHexPath(startQ, startR, targetQ, targetR, maxDist) {
  const activePlayer = this.getActivePlayer();
  const startKey = `${startQ}_${startR}`;
  const targetKey = `${targetQ}_${targetR}`;
  const startIndex = this.state.tileMap.get(startKey);
  const targetIndex = this.state.tileMap.get(targetKey);

  if (startIndex === undefined || targetIndex === undefined) return [];

  const queue = [{ index: startIndex, path: [startIndex], dist: 0 }];
  const visited = new Set([startIndex]);

  while (queue.length > 0) {
    const { index, path, dist } = queue.shift();

    if (dist >= maxDist) break;

    const tile = this.state.tiles[index];
    const neighbors = this.hexNeighbors(tile.q, tile.r);

    for (const n of neighbors) {
      const nKey = `${n.q}_${n.r}`;
      const nIndex = this.state.tileMap.get(nKey);

      if (nIndex !== undefined && !visited.has(nIndex)) {
        if (nIndex === targetIndex) return [...path, nIndex]; // *** ALLOW TARGET (Attack) ***

        const neighborTile = this.state.tiles[nIndex];

        // *** FIXED: BLOCK enemies + blocked tiles ***
        if (
          neighborTile.playerId === 0 || // Blocked
          (neighborTile.playerId !== undefined && // Has owner
            neighborTile.playerId !== activePlayer) // Enemy
        ) {
          continue; // *** NEVER PATH THROUGH ***
        }

        visited.add(nIndex);
        const newPath = [...path, nIndex];
        queue.push({ index: nIndex, path: newPath, dist: dist + 1 });
        if (nIndex === targetIndex) return newPath;
      }
    }
  }
  return [];
}
