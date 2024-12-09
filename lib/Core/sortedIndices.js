/**
 * Returns indices such that array[indices[i]] = sortedArray[i].
 * Eg. sortedIndices(['c', 'a', 'b', 'd']) => [1, 2, 0, 3]. (The sorted array is [a, b, c, d], and "a" was in position 1, "b" in position 2, etc.)
 * @param {Array} array The array to sort.
 * @param {Function} [compareFunction] The usual compare function, eg. function(a, b) { return a - b }.
 * @return {Array} The sorted indices, such that array[sortedIndices[0]] = sortedArray[0].
 */
function sortedIndices(array, compareFunction) {
  const length = array.length;
  const indices = new Array(length);
  for (let i = 0; i < length; i++) {
    indices[i] = i;
  }
  if (!compareFunction) {
    compareFunction = function (a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    };
  }
  indices.sort(function (a, b) {
    return compareFunction(array[a], array[b]);
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

export default sortedIndices;
