// Génère un CSV (avec BOM UTF-8 pour Excel) à partir de lignes d'objets
// et d'une liste de colonnes { key, label }.
export function toCsv<T extends Record<string, unknown>>(
    rows: T[],
    columns: { key: keyof T; label: string }[]
): string {
    const escape = (value: unknown): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (/[",\n;]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const header = columns.map((c) => escape(c.label)).join(";");
    const lines = rows.map((row) =>
        columns.map((c) => escape(row[c.key])).join(";")
    );

    return "﻿" + [header, ...lines].join("\r\n");
}
