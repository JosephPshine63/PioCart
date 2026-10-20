package dev.pioruocco.piocart.service.image;

import dev.pioruocco.piocart.dto.ImageDto;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Image;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.ImageRepository;
import dev.pioruocco.piocart.service.product.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ImageService implements IImageService {
    private final ImageRepository imageRepository;
    private final IProductService productService;


    @Override
    public Image getImageById(Long id) {
        return imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No image found with id: " + id));
    }

    // Postgres large objects can only be read inside a transaction
    @Override
    @Transactional(readOnly = true)
    public byte[] getImageBytes(Long id) {
        Blob blob = getImageById(id).getImage();
        try {
            return blob.getBytes(1, (int) blob.length());
        } catch (SQLException e) {
            throw new IllegalStateException("Could not read image " + id, e);
        }
    }

    @Override
    public void deleteImageById(Long id) {
        imageRepository.findById(id).ifPresentOrElse(imageRepository::delete, () -> {
            throw new ResourceNotFoundException("No image found with id: " + id);
        });

    }

    @Override
    public List<ImageDto> saveImages( Long productId,   List<MultipartFile> files) {
        Product product = productService.getProductById(productId);
        if (files.isEmpty()) {
            throw new IllegalArgumentException("No files to upload");
        }
        files.forEach(this::requireImage);

        List<ImageDto> savedImageDto = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                Image image = new Image();
                image.setFileName(file.getOriginalFilename());
                image.setFileType(file.getContentType());
                image.setImage(new SerialBlob(file.getBytes()));
                image.setProduct(product);

                String buildDownloadUrl = "/api/v1/images/image/download/";
                String downloadUrl = buildDownloadUrl+image.getId();
                image.setDownloadUrl(downloadUrl);
               Image savedImage = imageRepository.save(image);

               savedImage.setDownloadUrl(buildDownloadUrl+savedImage.getId());
               imageRepository.save(savedImage);

               ImageDto imageDto = new ImageDto();
               imageDto.setId(savedImage.getId());
               imageDto.setFileName(savedImage.getFileName());
               imageDto.setDownloadUrl(savedImage.getDownloadUrl());
               savedImageDto.add(imageDto);

            }   catch(IOException | SQLException e){
                throw new RuntimeException(e.getMessage());
            }
        }
        return savedImageDto;
    }

    

    @Override
    public void updateImage(MultipartFile file, Long imageId) {
        Image image = getImageById(imageId);
        requireImage(file);
        try {
            image.setFileName(file.getOriginalFilename());
            image.setFileType(file.getContentType());
            image.setImage(new SerialBlob(file.getBytes()));
            imageRepository.save(image);
        } catch (IOException | SQLException e) {
            throw new RuntimeException(e.getMessage());
        }

    }

    // The type is served back as the image's Content-Type, so only images are accepted
    private void requireImage(MultipartFile file) {
        String type = file.getContentType();
        if (file.isEmpty() || type == null || !type.startsWith("image/") || type.contains("svg")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
    }
}
