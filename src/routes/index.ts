import { Router } from "express";

import authRoutes from "./auth.routes";
import usersRoutes from "./usuarios.routes";
import categoriesRoutes from "./categorias.routes";
import eventsRoutes from "./eventos.routes";
import subscriptionsRoutes from "./inscricoes.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/events", eventsRoutes);
router.use("/subscriptions", subscriptionsRoutes);

export default router;
