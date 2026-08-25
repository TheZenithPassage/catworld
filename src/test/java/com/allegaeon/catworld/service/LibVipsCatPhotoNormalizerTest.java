package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LibVipsCatPhotoNormalizerTest {
    private final LibVipsCatPhotoNormalizer normalizer = new LibVipsCatPhotoNormalizer();

    @Test
    void rejectsPresentEmptyAndMisleadingIsoBmffBeforeNativeDecode() throws Exception {
        CatPhotoException empty = assertThrows(CatPhotoException.class,
                () -> normalizer.normalize(file(new byte[0], "empty.png")));
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT, empty.getCode());

        byte[] avif = ftyp("avif", "mif1");
        CatPhotoException misleading = assertThrows(CatPhotoException.class,
                () -> normalizer.normalize(file(avif, "misleading.heif")));
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT, misleading.getCode());

        byte[] generic = ftyp("mif1", "msf1");
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT,
                assertThrows(CatPhotoException.class,
                        () -> normalizer.normalize(file(generic, "generic.heif"))).getCode());

        MultipartFile oversized = mock(MultipartFile.class);
        when(oversized.getSize()).thenReturn(LibVipsCatPhotoNormalizer.MAX_BYTES + 1);
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_FILE_TOO_LARGE,
                assertThrows(CatPhotoException.class, () -> normalizer.normalize(oversized)).getCode());
        verify(oversized, never()).getBytes();
        MultipartFile exactLimit = mock(MultipartFile.class);
        when(exactLimit.getSize()).thenReturn(LibVipsCatPhotoNormalizer.MAX_BYTES);
        when(exactLimit.getBytes()).thenReturn(new byte[0]);
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT,
                assertThrows(CatPhotoException.class, () -> normalizer.normalize(exactLimit)).getCode());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_VIPS", matches = "true")
    void normalizesTransparentPngWithPremultipliedResizeAndWhiteBackground() throws Exception {
        BufferedImage source = new BufferedImage(3200, 20, BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < source.getWidth(); x++) {
            int alpha = x < 1600 ? 0 : 128;
            int rgb = new Color(220, 30, 40, alpha).getRGB();
            for (int y = 0; y < source.getHeight(); y++) source.setRGB(x, y, rgb);
        }
        ByteArrayOutputStream encoded = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(source, "png", encoded));

        NormalizedCatPhoto result = normalizer.normalize(file(encoded.toByteArray(), "alpha.png"));
        BufferedImage jpeg = ImageIO.read(new ByteArrayInputStream(result.bytes()));

        assertEquals(1600, result.width());
        assertEquals(10, result.height());
        Color transparent = new Color(jpeg.getRGB(100, 5));
        assertTrue(transparent.getRed() > 245 && transparent.getGreen() > 245 && transparent.getBlue() > 245);
        Color translucent = new Color(jpeg.getRGB(1500, 5));
        assertTrue(translucent.getRed() > translucent.getGreen() + 60);
        assertEquals(64, result.sha256().length());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_VIPS", matches = "true")
    void acceptsNativeFamiliesAndCanonicalizesSixteenBitAlphaAndEmbeddedIcc() throws Exception {
        Path directory = Files.createTempDirectory("cat-photo-native-");
        run("vips", "black", directory.resolve("source.v").toString(), "32", "24", "--bands", "4");
        for (String extension : List.of("jpg", "png", "webp")) {
            Path input = directory.resolve("photo." + extension);
            run("vips", "copy", directory.resolve("source.v").toString(), input.toString());
            NormalizedCatPhoto normalized = normalizer.normalize(file(Files.readAllBytes(input), input.getFileName().toString()));
            assertEquals(32, normalized.width(), extension);
            assertEquals(24, normalized.height(), extension);
            assertArrayEquals(new byte[] {(byte) 0xff, (byte) 0xd8},
                    java.util.Arrays.copyOf(normalized.bytes(), 2), extension);
        }
        Path heic = directory.resolve("photo.heic");
        run("vips", "copy", directory.resolve("source.v").toString(), heic + "[compression=hevc]");
        assertEquals(32, normalizer.normalize(file(Files.readAllBytes(heic), "photo.heic")).width());
        NormalizedCatPhoto heif = normalizer.normalize(file(Files.readAllBytes(heic), "photo.heif"));
        assertEquals(32, heif.width());

        Path alpha16 = directory.resolve("alpha16.png");
        run("vips", "cast", directory.resolve("source.v").toString(), alpha16.toString(), "ushort");
        BufferedImage white = ImageIO.read(new ByteArrayInputStream(
                normalizer.normalize(file(Files.readAllBytes(alpha16), "alpha16.png")).bytes()));
        Color pixel = new Color(white.getRGB(10, 10));
        assertTrue(pixel.getRed() > 245 && pixel.getGreen() > 245 && pixel.getBlue() > 245);

        Path rgb = directory.resolve("rgb.v");
        Path profiled = directory.resolve("profiled.jpg");
        Path neutral = directory.resolve("neutral.v");
        run("vips", "black", neutral.toString(), "16", "16", "--bands", "3");
        run("vips", "linear", neutral.toString(), rgb.toString(), "1 1 1", "200 40 20");
        run("vips", "icc_export", rgb.toString(), profiled.toString(), "--output-profile", "p3");
        NormalizedCatPhoto transformed = normalizer.normalize(file(Files.readAllBytes(profiled), "profiled.jpg"));
        Color transformedPixel = new Color(ImageIO.read(new ByteArrayInputStream(transformed.bytes())).getRGB(8, 8));
        assertEquals(200, transformedPixel.getRed(), 15);
        assertEquals(40, transformedPixel.getGreen(), 15);
        assertEquals(20, transformedPixel.getBlue(), 15);
        Path stripped = directory.resolve("stripped.jpg");
        Files.write(stripped, transformed.bytes());
        assertFalse(run("vipsheader", "-a", stripped.toString()).contains("icc-profile-data"));

        CatPhotoException undecodable = assertThrows(CatPhotoException.class,
                () -> normalizer.normalize(file(new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff}, "broken.jpg")));
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE, undecodable.getCode());

        byte[] validJpeg = Files.readAllBytes(profiled);
        byte[] malformedIcc = corruptProfilePcs(validJpeg);
        Path malformedIccPath = directory.resolve("malformed-icc.jpg");
        Files.write(malformedIccPath, malformedIcc);
        assertTrue(run("vipsheader", "-a", malformedIccPath.toString()).contains("icc-profile-data"));
        CatPhotoException malformedProfile = assertThrows(CatPhotoException.class,
                () -> normalizer.normalize(file(malformedIcc, "malformed-icc.jpg")));
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE, malformedProfile.getCode());

        byte[] tooLarge = pngWithDimensions(Files.readAllBytes(directory.resolve("photo.png")), 12001, 10000);
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_DIMENSIONS_TOO_LARGE,
                assertThrows(CatPhotoException.class,
                        () -> normalizer.normalize(file(tooLarge, "too-large.png"))).getCode());
        byte[] exactPixels = pngWithDimensions(Files.readAllBytes(directory.resolve("photo.png")), 12000, 10000);
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE,
                assertThrows(CatPhotoException.class,
                        () -> normalizer.normalize(file(exactPixels, "exact-pixels.png"))).getCode());
    }

    private static MockMultipartFile file(byte[] bytes, String name) {
        return new MockMultipartFile("photo", name, "application/octet-stream", bytes);
    }

    private static byte[] ftyp(String major, String compatible) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bytes.writeBytes(new byte[] {0, 0, 0, 20});
        bytes.writeBytes("ftyp".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        bytes.writeBytes(major.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        bytes.writeBytes(new byte[4]);
        bytes.writeBytes(compatible.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        return bytes.toByteArray();
    }

    private static String run(String... command) throws Exception {
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        String output = new String(process.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        assertEquals(0, process.waitFor(), () -> String.join(" ", command) + "\n" + output);
        return output;
    }

    private static byte[] corruptProfilePcs(byte[] jpeg) {
        byte[] corrupted = jpeg.clone();
        byte[] marker = "ICC_PROFILE".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        outer: for (int offset = 0; offset <= corrupted.length - marker.length; offset++) {
            for (int index = 0; index < marker.length; index++) {
                if (corrupted[offset + index] != marker[index]) continue outer;
            }
            byte[] bad = "BAD ".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
            System.arraycopy(bad, 0, corrupted, offset + 14 + 20, bad.length);
            return corrupted;
        }
        fail("Generated fixture did not contain an ICC profile");
        return corrupted;
    }

    private static byte[] pngWithDimensions(byte[] png, int width, int height) {
        byte[] changed = png.clone();
        java.nio.ByteBuffer.wrap(changed, 16, 8).putInt(width).putInt(height);
        java.util.zip.CRC32 crc = new java.util.zip.CRC32();
        crc.update(changed, 12, 17);
        java.nio.ByteBuffer.wrap(changed, 29, 4).putInt((int) crc.getValue());
        return changed;
    }
}
