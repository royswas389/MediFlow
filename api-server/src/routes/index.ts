import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import departmentsRouter from "./departments";
import doctorsRouter from "./doctors";
import queueRouter from "./queue";
import triageRouter from "./triage";
import appointmentsRouter from "./appointments";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(departmentsRouter);
router.use(doctorsRouter);
router.use(queueRouter);
router.use(triageRouter);
router.use(appointmentsRouter);
router.use(analyticsRouter);

export default router;
