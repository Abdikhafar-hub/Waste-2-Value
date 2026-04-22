const rules = require('../../src/modules/rules/rules.service');

describe('rules service defaults', () => {
  test('documents collection credit defaults', () => {
    expect(rules.DEFAULT_RULES.credits.collectionPerKg.ORGANIC).toBe(2);
    expect(rules.DEFAULT_RULES.credits.collectionPerKg.PLASTIC).toBe(4);
  });

  test('estimates output yields from centralized config', () => {
    const outputs = rules.estimateOutputs(rules.DEFAULT_RULES, 'ORGANIC', 100);
    expect(outputs).toEqual([
      { category: 'LARVAE', quantity: 18 },
      { category: 'FERTILIZER', quantity: 42 },
    ]);
  });
});
