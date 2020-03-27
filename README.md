# bills.html

Obsessive compulsive disorder for finances in HTML + JavaScript

## Demo

[https://brandonros.github.io/bills.html/](https://brandonros.github.io/bills.html/)

## Example input

```javascript
{
  dateOfBirth: '1900-01-01', // used for calculating age goals
  yearlyReturnRate: .07, // typical stock market return rate
  compoundingEnabled: false,
  accounts: [
    // Checking
    {type: 'checking', description: 'checking', balance: 1234},
    // 401k
    {type: 'investment', description: '401k', balance: 1234},
    // ESPP
    {type: 'investment', description: 'espp', balance: 1234},
    // Brokerage
    {type: 'investment', description: 'brokerage', balance: 1234},
    // IRAs
    {type: 'investment', description: 'ira', balance: 1234},
    // Debt
    {type: 'debt', description: 'debt', balance: 0},
  ],
  incomes: [
    {description: 'job', amount: 1234, daysOfMonth: [1, 15]}, // after payroll taxes, before 401k + ESPP contributions
  ],
  spendings:  [
    // credit cards
    {description: 'citi (discretionary)', amount: 1234, dayOfMonth: 2, balance: 123, statementStart: '2020-03-06', statementEnd: '2020-04-06'}, // variable monthly expenses like gas/food/shopping
    {description: 'amex (bills/subscriptions)', amount: 1234, dayOfMonth: 2}, // constant every month
    // checking account
    {description: 'rent', amount: 1234, dayOfMonth: 2},
    {description: 'power', amount: 123, dayOfMonth: 8},
    {description: 'car', amount: 123, dayOfMonth: 17, startDate: '2020-01-01', endDate: '2021-07-17'},
  ],
  investments: [
    // tax deferred
    {description: '401k', amount: 123, match: 456, daysOfMonth: [1, 15]},
    {description: 'ira', amount: 123, dayOfMonth: 2},
    // not tax deferred
    {description: 'espp', amount: 123, match: 45, daysOfMonth: [1, 15]},
    {description: 'brokerage', amount: 123, daysOfMonth: [1, 15]},
  ],
  outgos: [
    {description: 'taxes owed', amount: 125, date: '2020-04-15'},
  ],
  windfalls: [
    {description: 'citi underflow', amount: 394, date: '2020-04-02'},
  ]
}
```

## Supported time periods

* dayOfMonth (example: `2`)
* daysOfMonth (example `[1, 15]`)
* dayOfWeekName (example: `'Wednesday'`)
