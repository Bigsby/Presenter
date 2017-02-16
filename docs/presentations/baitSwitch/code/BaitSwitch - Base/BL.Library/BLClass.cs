namespace BL.Library
{
    public class BLClass
    {
        public BLClass()
        {
            ViewModel = new TheViewModel {
                Text = "This is cross platform text"
            };
        }

        public TheViewModel ViewModel { get; set; }
    }
}
