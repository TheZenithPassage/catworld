package com.allegaeon.catworld.security;

import com.allegaeon.catworld.service.DemoActivityService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@RequiredArgsConstructor
public class DemoRequestFilter extends OncePerRequestFilter {
    private static final String GENERATION_HEADER = "X-CatWorld-Demo-Generation";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private static final PathPatternRequestMatcher.Builder MATCHER = PathPatternRequestMatcher.withDefaults();
    private static final RequestMatcher API = MATCHER.matcher("/api/**");
    private static final RequestMatcher ACCOUNTS = MATCHER.matcher("/api/users/**");
    private static final RequestMatcher LOGIN = MATCHER.matcher(HttpMethod.POST, "/api/auth/login");
    private static final RequestMatcher NEW_STAY_PREVIEW = MATCHER.matcher(HttpMethod.POST, "/api/stays/pricing-preview");
    private static final RequestMatcher STAY_PREVIEW = MATCHER.matcher(HttpMethod.POST, "/api/stays/{id}/pricing-preview");

    private final DemoActivityService activity;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (LOGIN.matches(request)) {
            response.setHeader(GENERATION_HEADER, activity.generation());
        }
        if (!isMutation(request)) {
            chain.doFilter(request, response);
            return;
        }
        if (ACCOUNTS.matches(request)) {
            reject(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden");
            return;
        }
        if (!activity.generation().equals(request.getHeader(GENERATION_HEADER))) {
            reject(response, HttpServletResponse.SC_CONFLICT, "DEMO_RELOAD_REQUIRED");
            return;
        }
        activity.beginWrite();
        chain.doFilter(request, response);
        // An interrupted request or server error may have committed before the response failed.
        // Keep its durable marker so automatic restoration cannot discard that write.
        if (response.getStatus() < 500) {
            activity.finishWrite(response.getStatus() >= 200 && response.getStatus() < 300);
        }
    }

    private boolean isMutation(HttpServletRequest request) {
        return API.matches(request) && !SAFE_METHODS.contains(request.getMethod())
                && !LOGIN.matches(request) && !NEW_STAY_PREVIEW.matches(request) && !STAY_PREVIEW.matches(request);
    }

    private void reject(HttpServletResponse response, int status, String error) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"" + error + "\"}");
    }
}
