package dev.pioruocco.piocart.service.image;

import dev.pioruocco.piocart.dto.ImageDto;
import dev.pioruocco.piocart.model.Image;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IImageService {
    Image getImageById(Long id);
    byte[] getImageBytes(Long id);
    void deleteImageById(Long id);
    List<ImageDto> saveImages(Long productId, List<MultipartFile> files);
    void updateImage(MultipartFile file,  Long imageId);
}
