import { useState } from "react";
import { useAppData } from "../context/AppDataContext";

const STATUS_STYLE = {
  Available: "bg-sage-soft border-sage text-sage",
  Occupied: "bg-rose/15 border-rose text-rose",
  Dirty: "bg-amber/15 border-amber text-amber",
  Maintenance: "bg-cream-dim border-line text-ink/50",
};

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function RoomGrid() {
  const { rooms, activeFolios, markRoomStatus } = useAppData();
  const [statusFilter, setStatusFilter] = useState("all");

  function folioForRoom(roomNumber) {
    return activeFolios.find((f) => f.room_number === roomNumber);
  }

  const filtered = rooms.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const counts = ["Available", "Occupied", "Dirty", "Maintenance"].map((s) => ({
    status: s,
    count: rooms.filter((r) => r.status === s).length,
  }));

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Front Desk — Room Grid</h1>
      <p className="text-ink/55 mt-1 mb-5">Every room, color-coded by real-time status</p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setStatusFilter("all")}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            statusFilter === "all" ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
          }`}
        >
          All ({rooms.length})
        </button>
        {counts.map((c) => (
          <button
            key={c.status}
            onClick={() => setStatusFilter(c.status)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === c.status ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
            }`}
          >
            {c.status} ({c.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((room) => {
          const folio = room.status === "Occupied" ? folioForRoom(room.room_number) : null;
          return (
            <div
              key={room.id}
              className={`border rounded-xl p-4 ${STATUS_STYLE[room.status] || STATUS_STYLE.Maintenance}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-ink">{room.room_number}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide">{room.status}</span>
              </div>
              <p className="text-xs text-ink/50 mt-1">{room.room_types?.name}</p>

              {folio && (
                <div className="mt-2 pt-2 border-t border-current/20 text-xs text-ink/70 space-y-0.5">
                  <p className="font-medium text-ink truncate">{folio.guest_name}</p>
                  <p>{folio.meal_plan} · {folio.adults} adult{folio.adults === 1 ? "" : "s"}{folio.children ? `, ${folio.children} child` : ""}</p>
                  <p>Since {fmtDate(folio.check_in_date)}</p>
                </div>
              )}

              {room.status === "Dirty" && (
                <button
                  onClick={() => markRoomStatus(room.id, "Available")}
                  className="w-full mt-2 text-xs font-medium bg-white/70 rounded-lg py-1.5 text-ink/70"
                >
                  Mark cleaned
                </button>
              )}
              {room.status === "Available" && (
                <button
                  onClick={() => markRoomStatus(room.id, "Maintenance")}
                  className="w-full mt-2 text-xs font-medium bg-white/70 rounded-lg py-1.5 text-ink/50"
                >
                  Mark maintenance
                </button>
              )}
              {room.status === "Maintenance" && (
                <button
                  onClick={() => markRoomStatus(room.id, "Available")}
                  className="w-full mt-2 text-xs font-medium bg-white/70 rounded-lg py-1.5 text-ink/50"
                >
                  Back in service
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
