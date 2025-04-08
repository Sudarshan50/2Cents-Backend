import { errorResponse, successResponse } from "../lib/apiResponse.js";
import { exec } from "child_process";
let master = {};

master.getVar = async (req, res) => {
  try {
    const { tickers,confidence, maturity,  strikePrice, couponNumber } = req.body;
    // === Simulated test data (you can replace this with req.body) ===
    // const tickers = ["AAPL", "TSLA"];
    // const maturity = 8;              // in months
    // const pValue = 1000;             // portfolio value
    // const issuePrice = 406;          // product issue price
    // const barrier = 55;              // barrier level
    // const strikePrice = 55;          // strike
    // const couponNumber = 13;         // number of coupons

    // //tickers array object..
    // const tickers = [
    //   {
    //     ticker: "TSLA UQ Equity",
    //     name: "TESLA INC",
    //     weight: 50,
    //     strike: 406.58,
    //     barrier: 223.62,
    //     barrierDistance: 0,
    //   },
    //   {
    //     ticker: "NVDA UQ Equity",
    //     name: "NVIDIA CORP",
    //     weight: 50,
    //     strike: 142.62,
    //     barrier: 78.44,
    //     barrierDistance: 0,
    //   },
    // ];
    // const maturity = 8; // in months
    // const pValue = 1000; // portfolio value
    // const strikePrice = 55; // product issue price
    // const couponNumber = 13; // number of coupons

    const tickersStr = tickers
      .map((ticker) => ticker?.ticker?.split(" ")[0])
      .join(",");
    if (!tickersStr) {
      return res.status(400).send("Tickers array is empty or invalid.");
    }
    // === Step 1: Call calculate_max_var.py ===
    const step1Cmd = `python3 ../src/scripts/calculate_max_var.py --tickers ${tickersStr} --M ${maturity} --confidence ${confidence}`;
    console.log("Running:", step1Cmd);

    exec(step1Cmd, (err1, stdout1, stderr1) => {
      if (err1) {
        console.error("VAR Calculation Error:", stderr1 || err1.message);
        return errorResponse(res, "Error during VAR calculation.");
      }

      let varData;
      try {
        varData = JSON.parse(stdout1.trim());
      } catch (parseErr) {
        console.error("Error parsing max_var response:", parseErr.message);
        return errorResponse(res, "Invalid output from max_var script.");
      }

      const { max_var_stock, max_var_value } = varData;
      const issuePrice =
        tickers.find((ticker) => ticker.ticker.includes(max_var_stock))
          ?.strike || 0;
      const barrier =
        tickers.find((ticker) => ticker.ticker.includes(max_var_stock))
          ?.barrier || 0;

      // === Step 2: Call calculate_product_risk.py ===
      const step2Cmd = `python3 ../src/scripts/calculate_product_risk.py --stock ${max_var_stock} --max_var_value ${max_var_value} --issue_price ${issuePrice} --barrier ${(barrier/issuePrice)*100} --strike ${strikePrice} --coupon ${couponNumber}`;
      console.log("Running:", step2Cmd);

      exec(step2Cmd, (err2, stdout2, stderr2) => {
        if (err2) {
          console.error("Risk Calculation Error:", stderr2 || err2.message);
          return errorResponse(res, "Error during product risk calculation.");
        }

        let riskData;
        try {
          riskData = JSON.parse(stdout2.trim());
        } catch (parseErr2) {
          console.error("Error parsing risk response:", parseErr2.message);
          return errorResponse(res, "Invalid output from product risk script.");
        }

        // === Final Output ===
        return successResponse(res, "Risk calculation successful.", {
          max_var_stock,
          max_var_value,
          ...riskData,
        });
      });
    });
  } catch (err) {
    console.error("Server Error:", err.message);
    return errorResponse(
      res,
      "An error occurred while processing the request.",
      err
    );
  }
};

export default master;
