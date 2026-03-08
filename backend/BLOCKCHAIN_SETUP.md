# Blockchain y Ledger Encriptado para ÁBACO

Este proyecto ahora incluye un **ledger encadenado cifrado** (tipo blockchain interno) en PostgreSQL.

## 1) Qué hace el módulo actual

- Encadena bloques por `previous_hash` y `current_hash` (SHA-256).
- Cifra el payload con `AES-256-GCM`.
- Permite verificar integridad completa de la cadena.
- Expone endpoints seguros por rol para registrar, consultar, descifrar y verificar.

Endpoints:

- `GET /api/v1/ledger/blocks`
- `POST /api/v1/ledger/blocks`
- `GET /api/v1/ledger/verify`
- `GET /api/v1/ledger/blocks/:blockId/decrypt`
- `POST /api/v1/ledger/anchor-latest`
- `POST /api/v1/ledger/anchor-pending`
- `GET /api/v1/ledger/anchor-status`

## 2) Instalación mínima requerida (Windows)

Ya tienes casi todo. Solo necesitas:

1. Node.js 18+ (recomendado 20+)
2. PostgreSQL (ya en uso)
3. Variables de entorno en `backend/.env`:

```env
LEDGER_ENCRYPTION_KEY=pon_aqui_una_clave_larga_y_segura_min_32
```

## 3) Ejecutar migración del ledger

Desde la raíz del proyecto:

```powershell
npm --prefix backend run db:migrate:ledger
```

O todo junto:

```powershell
npm --prefix backend run db:migrate
```

## 4) Prueba rápida

1. Inicia backend.
2. Crea o usa token JWT.
3. Registra bloque:

```http
POST /api/v1/ledger/blocks
{
  "resource_type": "strategic_decision",
  "resource_id": "zone-12",
  "action": "RECOMMENDATION_CREATED",
  "payload": {"decision":"priorizar zona 12", "horizon_days":45},
  "metadata": {"source":"decision_engine"},
  "decision_score": 72.4
}
```

4. Verifica cadena:

```http
GET /api/v1/ledger/verify
```

## 5) Si quieres blockchain real (red privada)

Para evolucionar a red privada, instala:

- Docker Desktop
- Git
- Hardhat (`npm i -D hardhat`)
- ethers (`npm i ethers`)

Con eso se puede hacer **anclaje híbrido**:

- Guardar datos cifrados en PostgreSQL (rápido y económico)
- Publicar hash raíz en blockchain privada (inmutabilidad externa)

Ese es el siguiente paso recomendado para entorno empresarial.

## 6) Flujo híbrido listo (Hardhat local)

1. Ejecuta migración de anclaje:

```powershell
npm --prefix backend run db:migrate:ledger-anchor
```

2. Arranca nodo local Hardhat (en otra terminal):

```powershell
npm --prefix backend run blockchain:node
```

3. En `backend/.env` configura:

```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_PRIVATE_KEY=<private key de cuenta deployer hardhat>
```

4. Compila y despliega contrato:

```powershell
npm --prefix backend run blockchain:compile
npm --prefix backend run blockchain:deploy
```

5. Ancla el último bloque ledger:

```http
POST /api/v1/ledger/anchor-latest
```

También puedes anclar por lote:

```http
POST /api/v1/ledger/anchor-pending?limit=20
```

6. Consulta estado de anclaje:

```http
GET /api/v1/ledger/anchor-status
```

## 7) Anclaje automático por scheduler

En `backend/.env`:

```env
AUTO_ANCHOR_ENABLED=true
AUTO_ANCHOR_INTERVAL_SECONDS=60
AUTO_ANCHOR_BATCH_LIMIT=10
AUTO_ANCHOR_SOURCE=abaco-auto-scheduler
```

Con eso, al iniciar backend se ejecuta un ciclo periódico que ancla bloques `pending/failed` automáticamente.
