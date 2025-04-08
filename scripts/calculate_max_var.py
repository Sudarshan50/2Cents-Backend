# calculate_max_var.py
import numpy as np
import pandas as pd
import datetime as dt
import yfinance as yf
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--tickers", type=str, required=True)
parser.add_argument("--M", type=float, required=True)
parser.add_argument("--confidence_interval", type=float, default=0.8)
args = parser.parse_args()

tickers = args.tickers.split(",")
M = args.M
confidence_interval = args.confidence_interval

years = 9
endDate = dt.datetime.now()
startDate = endDate - dt.timedelta(days=252 * years)

close_df = pd.DataFrame()
for ticker in tickers:
    data = yf.download(ticker, start=startDate, end=endDate, progress=False, auto_adjust=True)
    close_df[ticker] = data['Close']

log_returns = np.log(close_df / close_df.shift(1)).dropna()

def expected_return(weights, log_returns):
    return np.sum(log_returns.mean() * weights)

def standard_deviation(weights, cov_matrix):
    variance = weights.T @ cov_matrix @ weights
    return np.sqrt(variance)

def random_z_score():
    return np.random.normal(0, 1)

def scenario_gain_loss(portfolio_value, portfolio_std_dev, z_score, days):
    return portfolio_value * portfolio_expected_return * days + portfolio_value * portfolio_std_dev * z_score * np.sqrt(days)

# confidence_interval = args.confidence_interval if hasattr(args, 'confidence_interval') else 0.8
portfolio_value = 100
days = int(21 * M)
simulations = 1000000

var_dict = {}
for ticker in tickers:
    single_stock_returns = log_returns[[ticker]]
    cov_matrix = single_stock_returns.cov()

    weights = np.array([1])
    portfolio_expected_return = expected_return(weights, single_stock_returns)
    portfolio_std_dev = standard_deviation(weights, cov_matrix)

    scenarioReturn = [
        scenario_gain_loss(portfolio_value, portfolio_std_dev, random_z_score(), days)
        for _ in range(simulations)
    ]

    VaR = -np.percentile(scenarioReturn, 100 * (1 - confidence_interval))
    var_dict[ticker] = VaR

max_var_stock = max(var_dict, key=var_dict.get)
max_var_value = min(var_dict[max_var_stock], 99)

print(json.dumps({
    "max_var_stock": max_var_stock,
    "max_var_value": max_var_value
}))
