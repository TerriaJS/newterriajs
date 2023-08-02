import {
  customLocalDataTypes,
  customRemoteDataTypes
} from "../../lib/Core/getDataType";
import * as UploadDataTypes from "../../lib/ViewModels/UploadDataTypes";

describe("UploadDataTypes", function () {
  afterEach(function () {
    customLocalDataTypes.clear();
    customRemoteDataTypes.clear();
  });

  describe("getDataTypes", function () {
    it("returns all the builtin local upload types", function () {
      expect(UploadDataTypes.getDataTypes().localDataType.length).toEqual(10);
    });

    it("returns all the builtin remote upload types", function () {
      expect(UploadDataTypes.getDataTypes().remoteDataType.length).toEqual(25);
    });
  });

  describe("addOrReplaceRemoteFileUploadType", function () {
    it("should add the given upload type to remoteDataType list", function () {
      UploadDataTypes.addOrReplaceRemoteFileUploadType("foo42", {
        value: "foo42",
        name: "Foo type",
        description: "Foo data"
      });
      const fooType = UploadDataTypes.getDataTypes().remoteDataType.find(
        (type) => type.value === "foo42"
      );
      expect(fooType).toBeDefined();
      expect(fooType?.name).toEqual("Foo type");
      expect(fooType?.description).toEqual("Foo data");
    });

    it("should override an existing type definition with the same key", function () {
      UploadDataTypes.addOrReplaceRemoteFileUploadType("foo42", {
        value: "foo42",
        name: "Foo type",
        description: "Foo files"
      });

      UploadDataTypes.addOrReplaceRemoteFileUploadType("foo42", {
        value: "foo42",
        name: "Another Foo type",
        description: "Some other foo files"
      });

      const fooTypes = UploadDataTypes.getDataTypes().remoteDataType.filter(
        (type) => type.value === "foo42"
      );

      expect(fooTypes).toEqual([
        {
          value: "foo42",
          name: "Another Foo type",
          description: "Some other foo files"
        }
      ]);
    });

    it("should not override an existing type with a different key", function () {
      UploadDataTypes.addOrReplaceRemoteFileUploadType("foo42", {
        value: "foo42",
        name: "Foo type",
        description: "Foo files"
      });

      UploadDataTypes.addOrReplaceRemoteFileUploadType("foo42-another", {
        value: "foo42",
        name: "Another Foo type",
        description: "Some other foo files"
      });

      const fooTypes = UploadDataTypes.getDataTypes().remoteDataType.filter(
        (type) => type.value === "foo42"
      );

      expect(fooTypes).toEqual([
        {
          value: "foo42",
          name: "Foo type",
          description: "Foo files"
        },
        {
          value: "foo42",
          name: "Another Foo type",
          description: "Some other foo files"
        }
      ]);
    });
  });

  describe("addOrReplaceLocalFileUploadType", function () {
    it("should add the given upload type to localDataType list", function () {
      UploadDataTypes.addOrReplaceLocalFileUploadType("foo42", {
        value: "foo42",
        name: "Foo type",
        description: "Foo files"
      });
      const fooType = UploadDataTypes.getDataTypes().localDataType.find(
        (type) => type.value === "foo42"
      );
      expect(fooType).toBeDefined();
      expect(fooType?.name).toEqual("Foo type");
      expect(fooType?.description).toEqual("Foo files");
    });

    it("should override an existing type definition with the same key", function () {
      UploadDataTypes.addOrReplaceLocalFileUploadType("foo42", {
        value: "foo42",
        name: "Foo type",
        description: "Foo files"
      });

      UploadDataTypes.addOrReplaceLocalFileUploadType("foo42", {
        value: "foo42",
        name: "Another Foo type",
        description: "Some other foo files"
      });

      const fooTypes = UploadDataTypes.getDataTypes().localDataType.filter(
        (type) => type.value === "foo42"
      );

      expect(fooTypes).toEqual([
        {
          value: "foo42",
          name: "Another Foo type",
          description: "Some other foo files"
        }
      ]);
    });

    it("should not override an existing type with a different key", function () {
      UploadDataTypes.addOrReplaceLocalFileUploadType("foo42", {
        value: "foo42",
        name: "Foo type",
        description: "Foo files"
      });

      UploadDataTypes.addOrReplaceLocalFileUploadType("foo42-another", {
        value: "foo42",
        name: "Another Foo type",
        description: "Some other foo files"
      });

      const fooTypes = UploadDataTypes.getDataTypes().localDataType.filter(
        (type) => type.value === "foo42"
      );

      expect(fooTypes).toEqual([
        {
          value: "foo42",
          name: "Foo type",
          description: "Foo files"
        },
        {
          value: "foo42",
          name: "Another Foo type",
          description: "Some other foo files"
        }
      ]);
    });
  });
});
