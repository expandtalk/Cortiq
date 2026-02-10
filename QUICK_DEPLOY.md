# ⚡ Super Snabb Deploy - 2 Minuter

## Steg 1: Öppna SQL Editor (30 sekunder)

**Klicka här:** https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/sql/new

---

## Steg 2: Kopiera + Klistra (1 minut)

### Migration 1: Unified Visitors Schema

1. **Öppna:** `supabase\migrations\20260210_unified_visitors.sql`
2. **Ctrl+A** → **Ctrl+C** (kopiera allt)
3. **Gå tillbaka till SQL Editor**
4. **Ctrl+V** (klistra in)
5. **Klicka "Run"** (nere till höger)

**Vänta tills "Success" visas** ✅

---

### Migration 2: Unified Visitors Functions

1. **Klicka "New Query"** (uppe till vänster)
2. **Öppna:** `supabase\migrations\20260210_unified_visitors_functions.sql`
3. **Ctrl+A** → **Ctrl+C**
4. **Gå tillbaka till SQL Editor**
5. **Ctrl+V**
6. **Klicka "Run"**

**Vänta tills "Success" visas** ✅

---

## Steg 3: Verifiera (30 sekunder)

Kör detta i SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('unified_visitors', 'visitor_session_links', 'visitor_events', 'visitor_segment_definitions');
```

**Förväntat resultat:**
```
unified_visitors
visitor_session_links
visitor_events
visitor_segment_definitions
```

---

## ✅ Klart!

**Nu fungerar:**
- ✅ Visitor identification edge function
- ✅ Database schema för unified visitors
- ✅ Frontend ändringar (engelska, GitHub-länk, Expandtalk kontakt)

**Testa:**
1. Gå till http://localhost:8080/
2. Öppna browser console
3. Du ska se: "CortIQ Visitor identified"

---

## 🎉 Total tid: ~2 minuter

Ingen CLI-krångel, inga komplexa kommandon - bara copy/paste!
