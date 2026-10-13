package fixtures.architecture.layers.sample.domain;

import fixtures.architecture.layers.sample.infrastructure.SampleRepositoryImpl;

/** Deliberate violation: a domain type depending on infrastructure. */
public class LeakyDomainObject {

    private final SampleRepositoryImpl repository = new SampleRepositoryImpl();

    public String load() {
        return repository.load();
    }
}
