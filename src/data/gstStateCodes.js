// Official GST state codes -> state names, matching the GSTR-1 template's
// "statesnew" master list exactly (so Place of Supply values validate).
export const GST_STATE_CODES = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Orissa", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "25": "Daman and Diu", "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep Islands",
  "32": "Kerala", "33": "Tamil Nadu", "34": "Pondicherry",
  "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh",
  "38": "Ladakh",
};

export function stateNameFromGstin(gstin) {
  if (!gstin || gstin.length < 2) return "Uttar Pradesh";
  return GST_STATE_CODES[gstin.slice(0, 2)] || "Uttar Pradesh";
}
