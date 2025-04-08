import e from "express";
import cors from "cors";
import masterRoter from "./router/masterRouter.js";

const app = e();
const port = 3000 || process.env.PORT;

// Enable CORS for all origins
app.use(cors());

app.use(e.json());
app.use(e.urlencoded({ extended: true }));

app.use("/api", masterRoter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});