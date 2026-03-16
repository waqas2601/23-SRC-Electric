import express, {
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import productRoutes from "./routes/product.routes.js";
import productModelRoutes from "./routes/productModel.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import ledgerPaymentRoutes from "./routes/ledgerPayment.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import summaryRoutes from "./routes/summary.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { requireAdmin } from "./middlewares/auth.middleware.js";

const app = express();

const helmetMiddleware = helmet as unknown as () => RequestHandler;

app.use(helmetMiddleware());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/product-models", requireAdmin, productModelRoutes);
app.use("/api/v1/products", requireAdmin, productRoutes);
app.use("/api/v1/customers", requireAdmin, customerRoutes);
app.use("/api/v1/invoices", requireAdmin, invoiceRoutes);
app.use("/api/v1/ledger-payments", requireAdmin, ledgerPaymentRoutes);
app.use("/api/v1/payments", requireAdmin, paymentRoutes);
app.use("/api/v1/summary", requireAdmin, summaryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
