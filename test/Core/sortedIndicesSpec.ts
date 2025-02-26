import sortedIndices from "../../lib/Core/sortedIndices";

describe("sortedIndices", function () {
  it("works", function () {
    const data = ["c", "a", "b", "d"];
    const indices = sortedIndices(data);
    expect(indices).toEqual([1, 2, 0, 3]);
  });
});
