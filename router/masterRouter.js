import e from "express";
import master from "../controller/masterController.js";

const masterRoter = e.Router();

masterRoter.post("/var",master.getVar);




export default masterRoter;