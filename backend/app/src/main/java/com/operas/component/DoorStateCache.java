@Component
public class DoorStateCache {
    private final BlockingQueue<String> doorEvents = new ArrayBlockingQueue<>(10);

    public void update(String payload) {
        doorEvents.offer(payload);
    }

    public boolean awaitDoorOpened(long timeout, TimeUnit unit) {
        try {
            String event = doorEvents.poll(timeout, unit);
            return "OPENED".equalsIgnoreCase(event);
        } catch (InterruptedException e) {
            return false;
        }
    }
}
