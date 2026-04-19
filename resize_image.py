import cv2

# Đọc hình ảnh từ file
# Thay 'image.jpg' bằng đường dẫn đến hình ảnh của bạn
image_path = 'image.jpg' 
try:
    image = cv2.imread(image_path)

    if image is None:
        print(f"Không thể đọc được hình ảnh từ đường dẫn: {image_path}")
    else:
        # Lấy kích thước ban đầu của hình ảnh
        original_height, original_width = image.shape[:2]
        print(f"Kích thước ban đầu: {original_width}x{original_height}")

        # Tính toán kích thước mới (một nửa kích thước ban đầu)
        new_width = int(original_width / 2)
        new_height = int(original_height / 2)

        # Thay đổi kích thước hình ảnh
        resized_image = cv2.resize(image, (new_width, new_height))

        print(f"Kích thước mới: {new_width}x{new_height}")

        # Lưu hình ảnh đã thay đổi kích thước
        output_path = 'resized_image.jpg'
        cv2.imwrite(output_path, resized_image)
        print(f"Hình ảnh đã được thay đổi kích thước và lưu tại: {output_path}")

        # (Tùy chọn) Hiển thị hình ảnh gốc và hình ảnh đã thay đổi kích thước
        cv2.imshow('Original Image', image)
        cv2.imshow('Resized Image', resized_image)

        # Đợi người dùng nhấn một phím bất kỳ để đóng cửa sổ hiển thị
        cv2.waitKey(0)
        cv2.destroyAllWindows()

except Exception as e:
    print(f"Đã xảy ra lỗi: {e}")
