/**
 * Returns indices such that array[indices[i]] = sortedArray[i].
 * Eg. sortedIndices(['c', 'a', 'b', 'd']) => [1, 2, 0, 3]. (The sorted array is [a, b, c, d], and "a" was in position 1, "b" in position 2, etc.)
 * @param array The array to sort.
 * @param [compareFunction] The usual compare function, eg. function(a, b) { return a - b }.
 * @return The sorted indices, such that array[sortedIndices[0]] = sortedArray[0].
 */
export default function sortedIndices<T>(
  array: T[],
  compareFunction?: (a: T, b: T) => number
): number[] {
  const length = array.length;
  const indices = new Array(length);
  for (let i = 0; i < length; i++) {
    indices[i] = i;
  }
  const cmp =
    compareFunction ??
    function (a: T, b: T): number {
      return a < b ? -1 : a > b ? 1 : 0;
    };
  indices.sort(function (a, b) {
    return cmp(array[a], array[b]);
  });
  return indices;
}

//
// Note: for indices which go in the other direction, just use indexOf like this:
//
// it('inverse indices work', function() {
//     var data = ['c', 'a', 'b', 'd'];
//     var sorted = data.slice().sort();
//     var inverseIndices = data.map(function(datum) { return sorted.indexOf(datum); });
//     expect(inverseIndices).toEqual([2, 0, 1, 3]);
// });
