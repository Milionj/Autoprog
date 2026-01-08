const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/role");

const router = express.Router();

/**
 * Validation Zod:
 *  une target fixe (SYSTEM)
 * But: éviter qu'on reçoive n'importe quoi (sécurité + robustesse)
 */

const commandSchema = z.object({
    type: z.enum(["START_FAN", "STOP_FAN", "RESET"]),
        target: z.literal("SYSTEM"),
    
});

//  * POST /commands
//  * - réservé operator/admin
//  * - simulation: on ne pilote pas une vraie machine ici, on "queue" la commande.

router.post("/", requireAuth, requireRole(["operator", "admin"]), (req, res) => {
    const parsed = commandSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Commande invalide"});
    }

    const cmd = parsed.data;
    

     // Simulation: log côté serveur (utile pour debug)
     console.log(
         `[COMMAND] ${new Date().toISOString()} - ${cmd.type} -> ${cmd.target} by ${req.user.email}`
     );

     return res.json({
            status: "queued",
    receivedAt: new Date().toISOString(),
    command: cmd,
     });
});

module.exports = router;

