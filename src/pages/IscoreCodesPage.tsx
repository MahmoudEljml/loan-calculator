import { useState } from "react";
import iScoreData from "../Project/json/iscore_codes.json";

export function IScoreCodesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  type IScoreItem = { code: string; name: string };
  const rawData = iScoreData.iScore_codes;
  const allCodes: IScoreItem[] = Array.isArray(rawData)
    ? rawData
    : Object.values(rawData)
      .flat()
      .filter(
        (item): item is IScoreItem =>
          typeof item === "object" &&
          item !== null &&
          "code" in item &&
          "name" in item
      );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCodes = normalizedSearch
    ? allCodes.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.code.toLowerCase().includes(normalizedSearch)
    )
    : allCodes;

  console.log(filteredCodes);
  return (
    <div className="space-y-4 text-start">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">أكواد iScore</h1>
        <p className="text-sm text-muted-foreground">
          مرجع لأكواد الاستعلام الائتماني (iScore) وتفسيرها.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="البحث باستخدام الكود أو الاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-medium">الكود</th>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.length > 0 ? (
                  filteredCodes.map((row) => (
                    <tr key={row.code} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono tabular-nums">{row.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-center text-muted-foreground">
                      لا توجد نتائج مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
