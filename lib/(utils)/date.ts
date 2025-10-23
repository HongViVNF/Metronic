const formatToISO = (input: string | Date): string => {
  // Chuyển input thành chuỗi nếu là đối tượng Date
  let cleanedString: string;
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error(`Invalid date format for ${input}`);
    }
    cleanedString = input.toISOString();
  } else {
    // Chuẩn hóa chuỗi: loại bỏ khoảng trắng thừa
    cleanedString = input.trim();
    // Nếu có dấu cách, thay bằng "T"
    cleanedString = cleanedString.replace(" ", "T");
    // Nếu thiếu phần giây (ví dụ: "2025-06-01T01:00"), bổ sung ":00"
    if (cleanedString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      cleanedString += ":00";
    }
    // Thêm mili-giây và hậu tố "Z" nếu chưa có
    if (!cleanedString.includes(".")) {
      cleanedString += ".000";
    }
    if (!cleanedString.endsWith("Z")) {
      cleanedString += "Z";
    }
  }
  // Kiểm tra xem chuỗi có hợp lệ không
  if (isNaN(new Date(cleanedString).getTime())) {
    throw new Error(`Invalid date format for ${input}`);
  }
  return cleanedString;
};

export default formatToISO;