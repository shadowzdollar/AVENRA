package fixtures.architecture.injection;

/** Deliberate violation: printing to the console instead of structured logging. */
public class ConsolePrinter {

    public void print(String message) {
        System.out.println(message);
    }
}
