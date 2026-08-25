FROM eclipse-temurin:25-jdk AS vips

ARG VIPS_VERSION=8.18.5
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential meson ninja-build pkg-config curl ca-certificates libexpat1-dev \
    libglib2.0-dev libjpeg-turbo8-dev libpng-dev libwebp-dev libheif-dev libde265-dev liblcms2-dev \
    libheif-plugin-libde265 libheif-plugin-x265 \
    && curl -fsSL "https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.xz" -o /tmp/vips.tar.xz \
    && tar -xf /tmp/vips.tar.xz -C /tmp \
    && meson setup /tmp/vips-build "/tmp/vips-${VIPS_VERSION}" -Dintrospection=disabled -Dexamples=false -Dcplusplus=false \
    && meson compile -C /tmp/vips-build \
    && meson install -C /tmp/vips-build

FROM vips AS native-test
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
ENV CATWORLD_NATIVE_VIPS=true
ENV MAVEN_OPTS=--enable-native-access=ALL-UNNAMED
RUN ldconfig && chmod +x mvnw && ./mvnw dependency:go-offline
COPY src src
RUN ./mvnw -DargLine=--enable-native-access=ALL-UNNAMED -Dtest=LibVipsCatPhotoNormalizerTest test

FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline
COPY src src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:25-jre
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libjpeg-turbo8 libpng16-16t64 libwebp7 libwebpmux3 libwebpdemux2 \
    libheif1 libde265-0 libheif-plugin-libde265 libheif-plugin-x265 liblcms2-2 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=vips /usr/local /usr/local
RUN ldconfig && vips --version && heif-convert --help >/dev/null 2>&1 || true
ENV LD_LIBRARY_PATH=/usr/local/lib/x86_64-linux-gnu:/usr/local/lib
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "--enable-native-access=ALL-UNNAMED", "-jar", "app.jar"]
