---
layout: default
title: Overview
permalink: /
---
<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow">Bachelor of Arts · Hochschule Furtwangen</p>
    <h1>Games &amp;<br>Immersive Media</h1>
    <p class="lead">Module Handbook · SPO Version 10</p>
    <a class="primary-link" href="{{ '/modules/' | relative_url }}">Explore modules <span>→</span></a>
  </div>
  <img class="hero-image" src="{{ '/assets/images/cover-photo.jpg' | relative_url }}" alt="">
</section>
<section class="intro-block">
  <div><p class="eyebrow">Digital module handbook</p><h2>Study structure and module information</h2></div>
  <p>This is a technical test project. It demonstrates how individually maintained JSON files can be rendered as readable module pages with Jekyll and GitHub Pages. The sample currently contains the extracted module <strong>Code 1</strong>; it is not yet a complete or officially reviewed handbook.</p>
</section>
<section class="module-preview">
  <div class="section-heading"><div><p class="eyebrow">Sample content</p><h2>Available module</h2></div><a href="{{ '/modules/' | relative_url }}">View all →</a></div>
  {% assign module = site.data.modules['code-1'] %}
  <a class="module-tile" href="{{ '/modules/code-1/' | relative_url }}">
    <span class="tile-number">0{{ module.semester }}</span>
    <span class="tile-main"><strong>{{ module.title }}</strong><small>Semester {{ module.semester }} · Required module</small></span>
    <span class="tile-credits">{{ module.credits }} ECTS</span><span class="tile-arrow">↗</span>
  </a>
</section>
