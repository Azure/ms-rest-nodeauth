import { expect } from "chai";
import "mocha";

describe("Hello function", () => {

  it("should return hello world", () => {
    expect("abc").to.equal("Hello world!");
  });

});