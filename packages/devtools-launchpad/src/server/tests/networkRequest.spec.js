const { handleNetworkRequest } = require("../networkRequest");

describe("networkRequest", () => {
  it("inline base64 json", () => {
    const url =
      "data:application/json;base64,eyJmaWxlIjoibmc6Ly8vU2V0dGluZ3NNb2R1bGUvWm1iU2V0dGluZ3NPcmRlckVtYWlsTmcyLm5nZmFjdG9yeS5qcyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1NldHRpbmdzTW9kdWxlL1ptYlNldHRpbmdzT3JkZXJFbWFpbE5nMi5uZ2ZhY3RvcnkuanMiLCJuZzovLy9TZXR0aW5nc01vZHVsZS9abWJTZXR0aW5nc09yZGVyRW1haWxOZzIuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPHptYi1zZXR0aW5ncy1vcmRlci1lbWFpbD48L3ptYi1zZXR0aW5ncy1vcmRlci1lbWFpbD4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7MEJDQUE7TUFBQSw4QkFBQTtNQUFBO0lBQUE7OzsifQ==";

    const json = jest.fn();
    handleNetworkRequest({ query: { url } }, { json });
    expect(json.mock.calls[0]).toMatchSnapshot();
  });
});
