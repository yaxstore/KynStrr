# IyanXd API

Free Fire Account Generator API — Node.js Edition.

## Endpoints

- `GET /` — info
- `GET /health` — health check
- `GET /gen` — generate akun
- `GET /gen_batch` — generate batch
- `GET /debug_gen` — debug step-by-step
- `GET /rarity_check` — cek rarity

## Query Params

| Param | Default | Deskripsi |
|---|---|---|
| `region` | `ID` | ID/IND/BD/PK/ME/VN/TH |
| `count` | `1` | Jumlah akun |
| `name` | `IYAN` | Prefix nickname |
| `password_prefix` | `IYAN` | Prefix password |
| `min_score` | `0` | Min rarity score |
| `tier` | - | RARE,EPIC,LEGENDARY,MYTHIC |
| `workers` | `4` | Thread batch |

## Contoh
