package fixtures.architecture.injection;

import org.springframework.beans.factory.annotation.Autowired;

/** Deliberate violation: field injection. */
public class FieldInjectedService {

    @Autowired
    @SuppressWarnings("unused")
    private Object dependency;
}
