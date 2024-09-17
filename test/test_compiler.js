function loadRemote(path) {
  return fetch(path).then((response) => response.text());
}


function buildCompilerTest() {

  QUnit.module("Compiler", function () {
  
    QUnit.test("gets toolkit", function (assert) {
      const toolkit = QubecTalk.getToolkit();
      assert.ok(toolkit !== undefined);
      assert.ok(toolkit["antlr4"] !== undefined);
      assert.ok(toolkit["QubecTalkLexer"] !== undefined);
      assert.ok(toolkit["QubecTalkParser"] !== undefined);
      assert.ok(toolkit["QubecTalkListener"] !== undefined);
      assert.ok(toolkit["QubecTalkVisitor"] !== undefined);
    });
    
    
    QUnit.test('loads remote files', assert => {
      const done = assert.async();

      loadRemote("/test/qta/basic.qta").then((content) => {
        assert.ok(content.length > 0);
        done();
      });
    });
    
  });

}


export { buildCompilerTest };
