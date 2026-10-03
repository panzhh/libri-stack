// Order statuses in the order they happen, with the names admins see
export const STATUS_LABELS = {
  pending: "Pending",
  ordered: "Ordered",
  arrived: "Arrived",
  delivered_paid: "Delivered and paid",
  declined: "Declined",
};

// Colours for the status dropdown in the admin Order Books tab
export const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  ordered: "bg-indigo-50 text-indigo-800 border-indigo-200",
  arrived: "bg-emerald-50 text-emerald-800 border-emerald-200",
  delivered_paid: "bg-teal-100 text-teal-900 border-teal-300",
  declined: "bg-rose-50 text-rose-800 border-rose-200",
};
