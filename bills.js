var goals = [
  45000,
  50000,
  55000,
  60000,
  65000,
  70000,
  75000,
  80000,
  85000,
  90000,
  95000,
  100000,
  125000,
  150000,
  175000,
  200000,
  225000,
  250000,
  275000,
  300000,
  325000,
  350000,
  375000,
  400000,
  425000,
  450000,
  475000,
  500000,
  550000,
  600000,
  650000,
  700000,
  750000,
  800000,
  850000,
  900000,
  950000,
  1000000,
  2000000,
  5000000,
  10000000
]

function convertAccountsToBalances(accounts) {
  return accounts.reduce(function (prev, account) {
    return Object.assign(prev, { [account.description]: account.balance })
  }, {})
}

function calculateInvestmentsTotalBalance(input, row) {
  return input.accounts.reduce((prev, account) => {
    if (account.type === 'investment') {
      return prev + row.balances[account.description]
    }
    return prev
  }, 0)
}

function buildRows(input, start, end) {
  var { accounts, incomes, spendings, investments, outgos, windfalls } = input
  var balances = convertAccountsToBalances(accounts);

  var rows = [];

  var numDays = end.diff(start, 'days');

  rows.push({
    index: 0,
    date: start.format('YYYY-MM-DD'),
    description: '',
    amount: 0,
    balances: JSON.parse(JSON.stringify(balances)),
    type: '',
    className: ''
  });

  for (var i = 1; i <= numDays; ++i) {
    var cursor = start.clone().startOf('day').add(i, 'days');

    var formattedCursorDate = cursor.format('YYYY-MM-DD');
    var formattedCursorDayOfWeekName = cursor.format('dddd');
    var formattedCursorDayOfMonth = parseInt(cursor.format('D'));
    var formattedCursorDayOfYear = parseInt(cursor.format('DDDD'));

    var dayHasEvent = false;

    var matchingIncomes = incomes.filter(function(income) {
      if (income.startDate && cursor.isBefore(income.startDate)) {
        return false;
      }

      if (income.endDate && cursor.isAfter(income.endDate)) {
        return false;
      }

      return (income.dayOfWeekName && income.dayOfWeekName === formattedCursorDayOfWeekName) ||
        (income.daysOfMonth && income.daysOfMonth.indexOf(formattedCursorDayOfMonth) !== -1);
    });

    var matchingWindfalls = windfalls.filter(function(windfall) {
      return windfall.date === formattedCursorDate;
    });

    var matchingInvestments = investments.filter(function(investment) {
      if (investment.startDate && cursor.isBefore(investment.startDate)) {
        return false;
      }

      if (investment.endDate && cursor.isAfter(investment.endDate)) {
        return false;
      }

      return (investment.dayOfWeekName && investment.dayOfWeekName === formattedCursorDayOfWeekName) ||
        (investment.daysOfMonth && investment.daysOfMonth.indexOf(formattedCursorDayOfMonth) !== -1) ||
        (investment.dayOfMonth === formattedCursorDayOfMonth) ||
        (investment.dayOfYear === formattedCursorDayOfYear);
    });

    var matchingCompounds = investments.filter(function(investment) {
      if (!input.compoundingEnabled) {
        return false;
      }
      return formattedCursorDayOfYear % 90 === 0;
    });

    var matchingSpendings = spendings.filter(function(spending) {
      if (spending.startDate && cursor.isBefore(spending.startDate)) {
        return false;
      }

      if (spending.endDate && cursor.isAfter(spending.endDate)) {
        return false;
      }

      return (spending.dayOfWeekName && spending.dayOfWeekName === formattedCursorDayOfWeekName) ||
        (spending.daysOfMonth && spending.daysOfMonth.indexOf(formattedCursorDayOfMonth) !== -1) ||
        (spending.dayOfMonth === formattedCursorDayOfMonth);
    });

    var matchingOutgos = outgos.filter(function(outgo) {
      return outgo.date === formattedCursorDate;
    });

    var dayHasEvent = matchingIncomes.length > 0 ||
      matchingWindfalls.length > 0 ||
      matchingInvestments.length > 0 ||
      matchingSpendings.length > 0 ||
      matchingCompounds.length > 0 ||
      matchingOutgos.length > 0;

    matchingIncomes.forEach(function(income) {
      balances.checking += income.amount;

      rows.push({
        index: i,
        date: formattedCursorDate,
        description: income.description,
        amount: income.amount,
        balances: JSON.parse(JSON.stringify(balances)),
        type: 'income',
        className: 'bg-success'
      });
    });

    matchingInvestments.forEach(function(investment) {
      balances.checking -= investment.amount;
      balances[investment.description] += investment.amount;

      rows.push({
        index: i,
        date: formattedCursorDate,
        description: investment.description,
        amount: investment.amount,
        balances: JSON.parse(JSON.stringify(balances)),
        type: 'investment',
        className: 'bg-warning'
      });

      if (investment.match) {
        var match = investment.matchStart ? (cursor.isAfter(investment.matchStart) ? investment.match : 0) : investment.match;

        if (match) {
          balances[investment.description] += match;

          rows.push({
            index: i,
            date: formattedCursorDate,
            description: investment.description + ' (match)',
            amount: match,
            balances: JSON.parse(JSON.stringify(balances)),
            type: 'investment',
            className: 'bg-warning'
          });
        }
      }
    });

    matchingSpendings.forEach(function(spending) {
      balances.checking -= spending.amount;

      if (spending.description === 'debt') {
        balances.debt += spending.amount;
      }

      rows.push({
        index: i,
        date: formattedCursorDate,
        description: spending.description,
        amount: -spending.amount,
        balances: JSON.parse(JSON.stringify(balances)),
        type: 'spending',
        className: 'bg-danger'
      });
    });

    matchingOutgos.forEach(function(outgo) {
      balances.checking -= outgo.amount;

      if (outgo.description === 'debt') {
        balances.debt += outgo.amount;
      }

      rows.push({
        index: i,
        date: formattedCursorDate,
        description: outgo.description,
        amount: -outgo.amount,
        balances: JSON.parse(JSON.stringify(balances)),
        type: 'outgo',
        className: 'bg-danger'
      });
    });

    matchingWindfalls.forEach(function(windfall) {
      balances.checking += windfall.amount;

      rows.push({
        index: i,
        date: formattedCursorDate,
        description: windfall.description,
        amount: windfall.amount,
        balances: JSON.parse(JSON.stringify(balances)),
        type: 'windfall',
        className: 'bg-success'
      });
    });

    matchingCompounds.forEach(function(compound) {
      if (!balances[compound.description]) {
        return
      }

      var annualReturn = 0.07;
      var periods = 4;
      var amount = Math.round(balances[compound.description] * (annualReturn / periods));
      balances[compound.description] += amount;
      rows.push({
        index: i,
        date: formattedCursorDate,
        description: `${compound.description} (compound)`,
        amount: amount,
        balances: JSON.parse(JSON.stringify(balances)),
        type: 'investment',
        className: 'bg-success'
      });
    });

    if (!dayHasEvent) {
      rows.push({
        index: i,
        date: formattedCursorDate,
        description: '',
        amount: 0,
        balances: JSON.parse(JSON.stringify(balances)),
        type: '',
        className: ''
      });
    }
  }

  return rows;
}

function drawDailyRows(input, rows) {
  var tbodyHtml = '';

  rows.forEach(function(row) {
    var investments = calculateInvestmentsTotalBalance(input, row)
    var netWorth = row.balances.checking + investments + row.balances.debt

    tbodyHtml += `<tr class="${row.className}">
      <td class="distance">${row.index}</td>
      <td class="date">${row.date}</td>
      <td class="description">${row.description}</td>
      <td class="type">${row.type}</td>
      <td class="amount">$${row.amount.toLocaleString()}</td>
      <td class="checking">$${row.balances.checking.toLocaleString()}</td>
      <td class="investments">$${(investments).toLocaleString()}</td>
      <td class="debt">$${(row.balances.debt || 0).toLocaleString()}</td>
      <td class="net-worth">$${(netWorth).toLocaleString()}</td>
    </tr>`;
  });

  return `<table class="table table-bordered">
    <thead>
      <tr>
        <th>Distance</th>
        <th>Date</th>
        <th>Description</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Checking</th>
        <th>Investments</th>
        <th>Debt</th>
        <th>Net worth</th>
      </tr>
    </thead>

    <tbody>
      ${tbodyHtml}
    </tbody>
  </table>`;
}

function calculateDayEndBalances(input, rows, type) {
  var dayEndBalances = {};

  rows.forEach(function(row) {
    var endOfDay = moment(row.date).endOf('day').format('YYYY-MM-DD');

    if (type === 'checking') {
      if (!dayEndBalances[row.date] || row.balances.checking < dayEndBalances[row.date]) {
        dayEndBalances[row.date] = row.balances.checking;
      }
    } else if (type === 'investments') {
      var balance = calculateInvestmentsTotalBalance(input, row)
      if (!dayEndBalances[row.date] || balance < dayEndBalances[row.date]) {
        dayEndBalances[row.date] = balance;
      }
    } else if (type === 'net worth') {
      var checkingBalance = row.balances.checking
      var investmentBalance = calculateInvestmentsTotalBalance(input, row)
      var debtBalance = row.balances.debt
      var netWorth = checkingBalance + investmentBalance + debtBalance
      if (!dayEndBalances[row.date] || netWorth < dayEndBalances[row.date]) {
        dayEndBalances[row.date] = netWorth;
      }
    }
  });

  var mappedRows = []
  var last

  Object.keys(dayEndBalances).forEach(function(key) {
    var balance = dayEndBalances[key]
    if (balance === last) {
      return
    }
    last = balance
    mappedRows.push({
      date: key,
      balance: balance
    })
  });

  return mappedRows
}

function drawStatementCalendar(input) {
  var spendings = input.spendings
  var spendingsWithStatements = spendings.filter(function(spending) { return spending.statementStart });
  return spendingsWithStatements.reduce(function (prev, spending) {
    var statementSize = moment(spending.statementEnd, 'YYYY-MM-DD').diff(moment(spending.statementStart, 'YYYY-MM-DD'), 'days') + 1
    var daysIn = moment().diff(moment(spending.statementStart, 'YYYY-MM-DD'), 'days') + 1
    var daysTillClose = moment(spending.statementEnd, 'YYYY-MM-DD').diff(moment(), 'days') + 1
    var dailySpending = Math.floor(spending.balance / daysIn)
    var targetMonthlySpending = spending.amount
    var targetDailySpending = Math.floor(targetMonthlySpending / statementSize)
    var currentTargetSpending = targetDailySpending * daysIn
    var currentSpendingDifference = (targetDailySpending * daysIn) - spending.balance
    var currentSpendingDifferenceVerbiage = currentSpendingDifference > 0 ? 'under' : 'over'
    var currentSpendingDifferencePercentage = Math.floor((currentSpendingDifference / currentTargetSpending) * 100)
    var dailySpendingDifference = Math.floor(targetDailySpending - dailySpending)
    var dailySpendingDifferenceVerbiage = dailySpendingDifference > 0 ? 'under' : 'over'
    var weeklySpending = dailySpending * 7
    var targetWeeklySpending = targetDailySpending * 7
    var weeklySpendingDifference = Math.floor(targetWeeklySpending - weeklySpending)
    var weeklySpendingDifferenceVerbiage = weeklySpendingDifference > 0 ? 'under' : 'over'
    var projectedMonthlySpending = Math.floor(dailySpending * statementSize)
    var monthlySpendingDifference = targetMonthlySpending - projectedMonthlySpending
    var monthlySpendingDifferenceVerbiage = monthlySpendingDifference > 0 ? 'under' : 'over'
    return prev + `
      <div>
        <strong>${spending.description}</strong><br>
        start: ${spending.statementStart}<br>
        end: ${spending.statementEnd}<br>
        size: ${statementSize} days<br>
        <br>
        ${daysIn} day(s) in<br>
        ${daysTillClose} day(s) till close<br>
        <br>
        $${spending.balance.toLocaleString()} current balance<br>
        $${currentTargetSpending.toLocaleString()} current balance target<br>
        $${currentSpendingDifference.toLocaleString()} (${currentSpendingDifferencePercentage}%) ${currentSpendingDifferenceVerbiage} target<br>
        <br>
        <strong>spending targets</strong><br>
        $${targetDailySpending.toLocaleString()}/day<br>
        $${targetWeeklySpending.toLocaleString()}/wk<br>
        $${targetMonthlySpending.toLocaleString()}/mo<br>
        <br>
        <strong>current projected spending</strong><br>
        $${dailySpending.toLocaleString()}/day<br>
        $${weeklySpending.toLocaleString()}/wk<br>
        $${projectedMonthlySpending.toLocaleString()}/mo<br>
        <br>
        <strong>projected vs target</strong><br>
        $${dailySpendingDifference.toLocaleString()}/day ${dailySpendingDifferenceVerbiage}<br>
        $${weeklySpendingDifference.toLocaleString()}/wk ${weeklySpendingDifferenceVerbiage}<br>
        $${monthlySpendingDifference.toLocaleString()}/mo ${monthlySpendingDifferenceVerbiage}
      </div>`
  }, '');
}

function calculateGoal(accounts, goal, dateOfBirth, yearlyReturnRate) {
  var totalContributed = 0
  var totalGrowth = 0
  var currentBalance = accounts.reduce(function(prev, account) {
    if (account.type === 'investment') {
      return prev + account.balance
    }
    return prev
  }, 0)
  var startingBalance = currentBalance
  var distance = goal - currentBalance
  var today = moment().startOf('day')
  var cursor = today.clone().add(1, 'day')
  var dailyReturnRate = yearlyReturnRate / 365
  var contributions = []
  while (currentBalance <= goal) {
    var formattedCursor = cursor.format('YYYY-MM-DD')
    var activeAccounts = accounts.filter(function(account) {
      if (account.startDate) {
        return account.frequency && cursor.isSameOrAfter(moment(account.startDate, 'YYYY-MM-DD'))
      }
      return account.frequency
    })
    var weeklyContribution = activeAccounts.filter(function(account) {
      return account.frequency === 'weekly'
    }).reduce(function(prev, account) {
      return prev + account.rate
    }, 0)
    var semiMonthlyContribution = activeAccounts.filter(function(account) {
      return account.frequency === 'semiMonthly'
    }).reduce(function(prev, account) {
      return prev + account.rate
    }, 0)
    var monthlyContribution = activeAccounts.filter(function(account) {
      return account.frequency === 'monthly'
    }).reduce(function(prev, account) {
      return prev + account.rate
    }, 0)
    totalGrowth += (currentBalance * dailyReturnRate)
    currentBalance *= (1 + dailyReturnRate)
    // weekly
    if (cursor.weekday() === 5) {
      currentBalance += weeklyContribution
      totalContributed += weeklyContribution
      contributions.push({
        type: 'weekly',
        date: formattedCursor,
        amount: weeklyContribution,
        balance: currentBalance,
        contributed: totalContributed
      })
    }
    // monthly + semi-monthly
    if (cursor.date() === 1) {
      // monthly
      currentBalance += monthlyContribution
      totalContributed += monthlyContribution
      contributions.push({
        type: 'monthly',
        date: formattedCursor,
        amount: monthlyContribution,
        balance: currentBalance,
        contributed: totalContributed
      })
      // semi monthly
      currentBalance += semiMonthlyContribution
      totalContributed += semiMonthlyContribution
      contributions.push({
        type: 'semiMonthly',
        date: formattedCursor,
        amount: semiMonthlyContribution,
        balance: currentBalance,
        contributed: totalContributed
      })
    }
    // semi monthly
    if (cursor.date() === 15) {
      currentBalance += semiMonthlyContribution
      totalContributed += semiMonthlyContribution
      contributions.push({
        type: 'semiMonthly',
        date: formattedCursor,
        amount: semiMonthlyContribution,
        balance: currentBalance,
        contributed: totalContributed
      })
    }
    cursor.add(1, 'day')
  }
  return {
    date: cursor.format('YYYY-MM-DD'),
    numDays: cursor.diff(today, 'days'),
    age: cursor.diff(dateOfBirth, 'years'),
    balance: currentBalance,
    contributions,
    distance,
    totalContributed,
    totalGrowth
  }
}

function determineInvestmentFrequency(investment) {
  if (investment.dayOfWeekName) {
    return 'weekly'
  } else if (investment.daysOfMonth) {
    return 'semiMonthly'
  } else if (investment.dayOfMonth) {
    return 'monthly'
  } else {
    throw new Error('Unable to determine investment frequency')
  }
}

function determineInvestmentRate(investment) {
  if (investment.match) {
    return investment.match + investment.amount
  }
  return investment.amount
}

function drawInvestmentGoalsOutput(input) {
  var { accounts, investments, dateOfBirth, yearlyReturnRate } = input
  var accountsWithFrequencyAndRates = accounts.map(function (account) {
    var investment = investments.find(function (investment) {
      return investment.description === account.description
    })
    if (!investment) {
      return account
    }
    return Object.assign({}, account, {
      frequency: determineInvestmentFrequency(investment),
      rate: determineInvestmentRate(investment)
    })
  })
  var tbodyHtml = ''
  goals.forEach(function (goal) {
    var result = calculateGoal(accountsWithFrequencyAndRates, goal, moment(dateOfBirth, 'YYYY-MM-DD'), yearlyReturnRate)
    if (result.numDays === 1) {
      return
    }
    tbodyHtml += `<tr>
      <td>${result.numDays}</td>
      <td>${result.date}</td>
      <td>$${result.balance.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td>${result.age}</td>
    </tr>`
  })
  return `<table class="table table-bordered">
    <thead>
      <tr>
        <th># days</th>
        <th>Date</th>
        <th>Balance</th>
        <th>Age</th>
      </tr>
    </thead>

    <tbody>
      ${tbodyHtml}
    </tbody>
  </table>`
}

function drawCharts(input, rows) {
  c3.generate({
    bindto: '#checkingChart',
    data: {
      x: 'x',
      columns: [
      ['x'].concat(calculateDayEndBalances(input, rows, 'checking').map(function(row) { return row.date })),
      ['checking'].concat(calculateDayEndBalances(input, rows, 'checking').map(function(row) { return row.balance }))
      ]
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%Y-%m-%d'
        }
      }
    }
  });
  c3.generate({
    bindto: '#investmentsChart',
    data: {
      x: 'x',
      columns: [
        ['x'].concat(calculateDayEndBalances(input, rows, 'investments').map(function(row) { return row.date })),
        ['investments'].concat(calculateDayEndBalances(input, rows, 'investments').map(function(row) { return row.balance }))
      ]
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%Y-%m-%d'
        }
      }
    }
  });
  c3.generate({
    bindto: '#netWorthChart',
    data: {
      x: 'x',
      columns: [
        ['x'].concat(calculateDayEndBalances(input, rows, 'net worth').map(function(row) { return row.date })),
        ['net worth'].concat(calculateDayEndBalances(input, rows, 'net worth').map(function(row) { return row.balance }))
      ]
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%Y-%m-%d'
        }
      }
    }
  });
}

function drawMonthlyTotals(input) {
  var totalMonthlyIncome = Math.round(input.incomes.reduce(function (prev, income) {
    if (income.daysOfMonth) {
      return prev + (income.amount * income.daysOfMonth.length)
    } else if (income.dayOfWeekName) {
      return prev + (income.amount * 4.33) // 4.33 weeks in a month
    } else if (income.dayOfMonth) {
      return prev + income.amount
    } else {
      throw new Error('Unknown income frequency')
    }
  }, 0))
  var totalMonthlyInvestmentContributions = Math.round(input.investments.reduce(function (prev, investment) {
    if (investment.daysOfMonth) {
      return prev + (investment.amount * investment.daysOfMonth.length)
    } else if (investment.dayOfWeekName) {
      return prev + (investment.amount * 4.33) // 4.33 weeks in a month
    } else if (investment.dayOfMonth) {
      return prev + investment.amount
    } else {
      throw new Error('Unknown investment frequency')
    }
  }, 0))
  var totalMonthlyInvestmentMatch = Math.round(input.investments.reduce(function (prev, investment) {
    if (!investment.match) {
      return prev
    }
    if (investment.daysOfMonth) {
      return prev + (investment.match * investment.daysOfMonth.length)
    } else if (investment.dayOfWeekName) {
      return prev + (investment.match * 4.33) // 4.33 weeks in a month
    } else if (investment.dayOfMonth) {
      return prev + investment.match
    } else {
      throw new Error('Unknown investment frequency')
    }
  }, 0))
  var totalMonthlySpending = Math.round(input.spendings.reduce(function (prev, spending) {
    if (spending.daysOfMonth) {
      return prev + (spending.amount * spending.daysOfMonth.length)
    } else if (spending.dayOfWeekName) {
      return prev + (spending.amount * 4.33) // 4.33 weeks in a month
    } else if (spending.dayOfMonth) {
      return prev + spending.amount
    } else {
      throw new Error('Unknown spending frequency')
    }
  }, 0))
  var totalMonthlySavings = totalMonthlyIncome - totalMonthlyInvestmentContributions - totalMonthlySpending
  document.querySelector('#totalMonthlyIncome').innerHTML = `total monthly income: \$${totalMonthlyIncome.toLocaleString()}`
  document.querySelector('#totalMonthlyInvestmentContributions').innerHTML = `total investment contributions: \$${totalMonthlyInvestmentContributions.toLocaleString()}`
  document.querySelector('#totalMonthlyInvestmentMatch').innerHTML = `total investment match: \$${totalMonthlyInvestmentMatch.toLocaleString()}`
  document.querySelector('#totalMonthlySpending').innerHTML = `total monthly spending: \$${totalMonthlySpending.toLocaleString()}`
  document.querySelector('#totalMonthlySavings').innerHTML = `total monthly savings: \$${totalMonthlySavings.toLocaleString()}`
}

function drawAverageMonthlyDifferences(input, numMonths, rows) {
  var firstRow = rows[0]
  var lastRow = rows[rows.length - 1]
  var checkingDifference = lastRow.balances.checking - firstRow.balances.checking
  var investmentsDifference = calculateInvestmentsTotalBalance(input, lastRow) - calculateInvestmentsTotalBalance(input, firstRow)
  var netWorthDifference = checkingDifference + investmentsDifference
  var monthlyCheckingDifference = Math.round(checkingDifference / numMonths)
  var monthlyInvestmentsDifference = Math.round(investmentsDifference / numMonths)
  var monthlyNetWorthDifference = Math.round(netWorthDifference / numMonths)
  document.querySelector('#monthlyCheckingDifference').innerHTML = `average monthly difference: \$${monthlyCheckingDifference.toLocaleString()}`
  document.querySelector('#monthlyInvestmentsDifference').innerHTML = `average monthly difference: \$${monthlyInvestmentsDifference.toLocaleString()}`
  document.querySelector('#monthlyNetWorthDifference').innerHTML = `average monthly difference: \$${monthlyNetWorthDifference.toLocaleString()}`
}

document.querySelector('#run').addEventListener('click', function () {
  var input = eval(`(${document.querySelector('#input').value})`)
  var numMonths = parseInt(document.querySelector('#numMonths').value)
  var start = moment().startOf('day')
  var end = moment().add(numMonths, 'months').endOf('month')
  var rows = buildRows(input, start, end)
  drawMonthlyTotals(input)
  drawAverageMonthlyDifferences(input, numMonths, rows)
  drawCharts(input, rows)
  document.querySelector('#dailyBreakdownOutput').innerHTML = drawDailyRows(input, rows)
  document.querySelector('#statementCalendarOutput').innerHTML = drawStatementCalendar(input)
  document.querySelector('#investmentGoalsOutput').innerHTML = drawInvestmentGoalsOutput(input)
})

document.querySelector('#input').addEventListener('keyup', function () {
  var stringifiedInput = btoa(document.querySelector('#input').value)
  var numMonths = document.querySelector('#numMonths').value
  document.querySelector('#url').value = `${window.location.protocol}//${window.location.hostname}${window.location.pathname}?input=${stringifiedInput}&numMonths=${numMonths}`
})

document.querySelector('#numMonths').addEventListener('keyup', function () {
  var stringifiedInput = btoa(document.querySelector('#input').value)
  var numMonths = document.querySelector('#numMonths').value
  document.querySelector('#url').value = `${window.location.protocol}//${window.location.hostname}${window.location.pathname}?input=${stringifiedInput}&numMonths=${numMonths}`
})

document.querySelector('#copy').addEventListener('click', function () {
  const element = document.createElement('textarea')
  element.value = document.querySelector('#url').value
  document.body.appendChild(element)
  element.select()
  document.execCommand('copy')
  document.body.removeChild(element)
})

window.addEventListener('load', function () {
  if (window.location.search) {
    var searchParams = new URLSearchParams(window.location.search)
    var input = searchParams.get('input')
    var numMonths = searchParams.get('numMonths')
    if (input && numMonths) {
      document.querySelector('#numMonths').value = numMonths
      document.querySelector('#input').value = atob(input)
      var event = document.createEvent('HTMLEvents')
      event.initEvent('keyup', false, true)
      document.querySelector('#input').dispatchEvent(event)
      document.querySelector('#run').click()
    }
  }
})
